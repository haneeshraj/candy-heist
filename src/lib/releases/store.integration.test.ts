// @vitest-environment node
import { createHash, randomUUID } from 'node:crypto';
import { MongoClient, ObjectId } from 'mongodb';
import sharp from 'sharp';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { COLLECTIONS } from '@/lib/db/collections';
import { removeCover, uploadCover } from '@/lib/storage/covers';
import type { BatchResult, ReleasesSnapshot } from './model';
import type { ReleasesOutcome } from './store';

// The releases store against a real MongoDB, opt-in: set TEST_MONGODB_URI
// to a server you don't mind a scratch database on. It makes its own
// database and drops it after, so nothing else on that server is touched.
//
//   TEST_MONGODB_URI=mongodb://127.0.0.1:27017 npx vitest run releases/store.integration

// Storage stood in for: covers are made for real, but go nowhere. Each
// lands at a name made from its bytes, as in the bucket.
vi.mock('@/lib/storage/covers', async (actual) => ({
  ...(await actual<typeof import('@/lib/storage/covers')>()),
  uploadCover: vi.fn(async (releaseId: string, data: Buffer) => {
    const hash = createHash('sha256').update(data).digest('hex');
    const path = `${releaseId}/${hash.slice(0, 16)}.webp`;
    return { path, url: `https://storage.test/covers-dev/${path}` };
  }),
  uploadTape: vi.fn(async (releaseId: string, data: Buffer) => {
    const hash = createHash('sha256').update(data).digest('hex');
    const path = `${releaseId}/tape-${hash.slice(0, 16)}.webp`;
    return { path, url: `https://storage.test/covers-dev/${path}` };
  }),
  removeCover: vi.fn()
}));

const uri = process.env.TEST_MONGODB_URI;
const name = `candy_heist_itest_${randomUUID().slice(0, 8)}`;

function snapshot<T extends ReleasesSnapshot>(outcome: ReleasesOutcome<T>): T {
  if (!outcome.ok)
    throw new Error(`Expected ok, got ${JSON.stringify(outcome)}`);
  return outcome.snapshot;
}

/** A release as the database keeps it, for what the snapshot leaves out. */
async function stored(id: string) {
  const client = await new MongoClient(uri ?? '').connect();
  try {
    return await client
      .db(name)
      .collection(COLLECTIONS.releasesPublished)
      .findOne({ _id: new ObjectId(id) });
  } finally {
    await client.close();
  }
}

const release = (patch: object = {}) => ({
  title: 'Menace',
  kind: 'single',
  status: 'released',
  artist: 'Candy Heist',
  date: '2025-03-14',
  credits: [],
  tracks: [{ title: 'Menace', isrc: 'QZES82500001' }],
  distribution: [
    {
      platform: 'spotify',
      streamUrl: 'https://open.spotify.com/album/4aawyAB9vmqN3uQ7FjRGTy'
    }
  ],
  upc: '199350000001',
  ...patch
});

describe.skipIf(!uri)('the releases store, against a real database', () => {
  beforeAll(() => {
    vi.stubEnv('MONGODB_URI', uri ?? '');
    vi.stubEnv('MONGODB_DB', name);
  });

  afterAll(async () => {
    const client = await new MongoClient(uri ?? '').connect();
    await client.db(name).dropDatabase();
    await client.close();
    vi.unstubAllEnvs();
  });

  it('publishes everything, then keeps each release in step', async () => {
    const store = await import('./store');

    // Nothing sent: the site keeps its own releases.
    expect(await store.releasesSnapshot()).toEqual({
      live: false,
      releases: [],
      shelf: []
    });

    // A single send before "Publish everything" is refused, and so are
    // several changes at once.
    expect(
      await store.publishRelease({ ref: 'x', fields: release() }, 'candy')
    ).toMatchObject({ ok: false, status: 409 });
    expect(
      await store.applyChanges(
        { add: [{ ref: 'x', fields: release() }] },
        'candy'
      )
    ).toMatchObject({ ok: false, status: 409, body: { error: 'not_live' } });

    // Everything at once: the site goes live, with an id per Haven ref.
    const first = snapshot<BatchResult>(
      await store.publishEverything(
        {
          releases: [
            { ref: 'h-menace', fields: release() },
            {
              ref: 'h-4x4',
              fields: release({
                title: '4x4',
                kind: 'ep',
                status: 'draft',
                date: null,
                upc: '',
                distribution: [],
                tracks: [{ title: 'Menace' }, { title: 'Overdrive' }]
              })
            }
          ]
        },
        'candy'
      )
    );
    expect(first.live).toBe(true);
    const menace = first.ids['h-menace'];
    const ep = first.ids['h-4x4'];
    expect(first.releases.find((r) => r.id === menace)).toMatchObject({
      slug: 'menace',
      visible: true
    });
    // A draft: kept, but not shown until it's announced or out.
    expect(first.releases.find((r) => r.id === ep)).toMatchObject({
      slug: '4x4',
      visible: false
    });

    // The other copy of Haven sends the same release: recognised by its
    // UPC, so it's the same one, not a second.
    const other = snapshot<BatchResult>(
      await store.publishRelease(
        { ref: 'other-menace', fields: release({ title: 'MENACE' }) },
        'mist'
      )
    );
    expect(other.ids['other-menace']).toBe(menace);
    expect(other.releases).toHaveLength(2);

    // A change carries only its own field; the rest stays as it was.
    const changed = snapshot(
      await store.updateRelease(menace, { label: 'Self-released' }, 'candy')
    );
    expect(changed.releases.find((r) => r.id === menace)?.title).toBe('MENACE');
    // A change the pages can't show is refused whole.
    expect(
      await store.updateRelease(
        menace,
        { tracks: [{ title: 'A' }, { title: 'B' }] },
        'candy'
      )
    ).toMatchObject({ ok: false, status: 400 });

    // Not hidden isn't announced: a draft stays back, and off the shelf.
    const switched = snapshot(
      await store.setVisibility(ep, { shown: true }, 'candy')
    );
    expect(switched.releases.find((r) => r.id === ep)?.visible).toBe(false);
    expect(await store.setShelf({ ids: [ep, menace] })).toMatchObject({
      ok: false,
      status: 409,
      body: { error: 'hidden' }
    });

    // Scheduled for no day isn't announced yet; for a day, it shows, and the
    // shelf holds what exists, in order.
    const undated = snapshot(
      await store.updateRelease(ep, { status: 'scheduled' }, 'candy')
    );
    expect(undated.releases.find((r) => r.id === ep)?.visible).toBe(false);
    const announced = snapshot(
      await store.updateRelease(ep, { date: '2999-01-01' }, 'candy')
    );
    expect(announced.releases.find((r) => r.id === ep)?.visible).toBe(true);
    expect(snapshot(await store.setShelf({ ids: [ep, menace] })).shelf).toEqual(
      [ep, menace]
    );
    expect(
      await store.setShelf({ ids: ['0123456789abcdef01234567'] })
    ).toMatchObject({ ok: false, status: 409 });

    // Hidden, it comes off the shelf, and can't go back on while hidden.
    const hidden = snapshot(
      await store.setVisibility(ep, { shown: false }, 'candy')
    );
    expect(hidden.shelf).toEqual([menace]);
    expect(await store.setShelf({ ids: [ep, menace] })).toMatchObject({
      ok: false,
      status: 409,
      body: { error: 'hidden' }
    });
    snapshot(await store.setVisibility(ep, { shown: null }, 'candy'));
    expect(snapshot(await store.setShelf({ ids: [ep, menace] })).shelf).toEqual(
      [ep, menace]
    );

    // A new release with a title already taken gets the next address.
    const twin = snapshot<BatchResult>(
      await store.publishRelease(
        {
          ref: 'h-menace-ep',
          fields: release({
            kind: 'ep',
            upc: '',
            distribution: [],
            tracks: [{ title: 'A' }, { title: 'B' }]
          })
        },
        'candy'
      )
    );
    const twinId = twin.ids['h-menace-ep'];
    expect(twin.releases.find((r) => r.id === twinId)?.slug).toBe('menace-2');

    // Removed: off the site and off the shelf.
    const removed = snapshot(await store.removeRelease(menace));
    expect(removed.releases.map((r) => r.id)).not.toContain(menace);
    expect(removed.shelf).toEqual([ep]);
  });

  it('makes several changes together, or none of them', async () => {
    const store = await import('./store');
    const single = (title: string, upc: string, patch: object = {}) =>
      release({ title, upc, distribution: [], tracks: [{ title }], ...patch });

    const { ids } = snapshot<BatchResult>(
      await store.publishEverything(
        {
          releases: [
            { ref: 'h-overdrive', fields: single('Overdrive', '199350000011') },
            { ref: 'h-afterglow', fields: single('Afterglow', '199350000012') }
          ]
        },
        'candy'
      )
    );
    const overdrive = ids['h-overdrive'];
    const afterglow = ids['h-afterglow'];
    snapshot(await store.setShelf({ ids: [afterglow, overdrive] }));

    // A label, a release hidden and the shelf, in one request.
    const together = snapshot<BatchResult>(
      await store.applyChanges(
        {
          update: [{ id: overdrive, fields: { label: 'Nayara Records' } }],
          visibility: [{ id: afterglow, shown: false }],
          shelf: [overdrive]
        },
        'mist'
      )
    );
    expect(together.ids).toEqual({});
    expect(together.shelf).toEqual([overdrive]);
    expect(together.releases.find((r) => r.id === afterglow)?.visible).toBe(
      false
    );
    expect(await stored(overdrive)).toMatchObject({
      label: 'Nayara Records',
      updatedBy: 'mist'
    });

    // A shelf naming a hidden release refuses the whole request.
    expect(
      await store.applyChanges(
        {
          update: [{ id: overdrive, fields: { label: 'Candy Records' } }],
          shelf: [overdrive, afterglow]
        },
        'candy'
      )
    ).toMatchObject({ ok: false, status: 409, body: { error: 'hidden' } });
    expect(await stored(overdrive)).toMatchObject({
      label: 'Nayara Records',
      updatedBy: 'mist'
    });

    // The shelf is judged as the changes leave it: hidden and shelved at
    // once is refused, shown again and shelved at once is not.
    expect(
      await store.applyChanges(
        { visibility: [{ id: overdrive, shown: false }], shelf: [overdrive] },
        'candy'
      )
    ).toMatchObject({ ok: false, status: 409, body: { error: 'hidden' } });
    expect((await stored(overdrive))?.shown).toBeNull();
    const back = snapshot(
      await store.applyChanges(
        {
          visibility: [{ id: afterglow, shown: null }],
          shelf: [afterglow, overdrive]
        },
        'candy'
      )
    );
    expect(back.shelf).toEqual([afterglow, overdrive]);

    // Made a draft before its day, with no shelf sent: it comes off it.
    const drafted = snapshot(
      await store.applyChanges(
        {
          update: [
            { id: afterglow, fields: { status: 'draft', date: '2999-01-01' } }
          ]
        },
        'candy'
      )
    );
    expect(drafted.releases.find((r) => r.id === afterglow)?.visible).toBe(
      false
    );
    expect(drafted.shelf).toEqual([overdrive]);

    // A release no longer here: the request is refused, naming it.
    const gone = '0123456789abcdef01234567';
    expect(
      await store.applyChanges(
        {
          update: [{ id: overdrive, fields: { label: 'Candy Records' } }],
          visibility: [{ id: gone, shown: false }]
        },
        'candy'
      )
    ).toMatchObject({
      ok: false,
      status: 409,
      body: { error: 'out_of_date', ids: [gone] }
    });
    expect((await stored(overdrive))?.label).toBe('Nayara Records');

    // A change the pages can't show says which release, and stops the new
    // release sent with it too.
    expect(
      await store.applyChanges(
        {
          add: [
            { ref: 'h-static', fields: single('Static Bloom', '199350000013') }
          ],
          update: [
            {
              id: overdrive,
              fields: { tracks: [{ title: 'A' }, { title: 'B' }] }
            }
          ]
        },
        'candy'
      )
    ).toMatchObject({
      ok: false,
      status: 400,
      body: {
        error: 'invalid',
        message: 'Overdrive: A single holds exactly one track.'
      }
    });
    expect(
      (await store.releasesSnapshot()).releases.map((r) => r.title)
    ).not.toContain('Static Bloom');

    // New releases come back with their ids; one recognised is the same one.
    const sent = snapshot<BatchResult>(
      await store.applyChanges(
        {
          add: [
            { ref: 'h-static', fields: single('Static Bloom', '199350000013') },
            {
              ref: 'other-overdrive',
              fields: single('Overdrive', '199350000011', {
                label: 'Candy Records'
              })
            }
          ]
        },
        'mist'
      )
    );
    expect(Object.keys(sent.ids).sort()).toEqual([
      'h-static',
      'other-overdrive'
    ]);
    expect(sent.ids['other-overdrive']).toBe(overdrive);
    expect(
      sent.releases.find((r) => r.id === sent.ids['h-static'])
    ).toMatchObject({ slug: 'static-bloom', visible: true });
    expect((await stored(overdrive))?.label).toBe('Candy Records');
  });

  it('gives a release its cover, swaps it, and takes it off', async () => {
    const store = await import('./store');
    const square = (side: number, colour: string) =>
      sharp({
        create: { width: side, height: side, channels: 3, background: colour }
      })
        .png()
        .toBuffer();

    const { ids } = snapshot<BatchResult>(
      await store.publishEverything(
        {
          releases: [
            {
              ref: 'h-cover',
              fields: release({
                title: 'Cover Story',
                upc: '199350000021',
                distribution: [],
                tracks: [{ title: 'Cover Story' }]
              })
            }
          ]
        },
        'candy'
      )
    );
    const id = ids['h-cover'];
    const coverOf = (s: ReleasesSnapshot) =>
      s.releases.find((r) => r.id === id)?.cover;
    expect(coverOf(await store.releasesSnapshot())).toBeNull();

    // Made into the site's WebP, stored, and the release pointed at it.
    const first = await store.setCover(
      id,
      await square(1000, '#b1272b'),
      'mist'
    );
    expect(first).toMatchObject({ ok: true, siteChanged: true });
    const firstUrl = coverOf(snapshot(first));
    expect(firstUrl).toMatch(
      new RegExp(`^https://storage\.test/covers-dev/${id}/[0-9a-f]{16}\.webp$`)
    );
    const [releaseId, data] = vi.mocked(uploadCover).mock.calls[0];
    expect(releaseId).toBe(id);
    expect((await sharp(data).metadata()).format).toBe('webp');
    const kept = await stored(id);
    expect(kept).toMatchObject({
      updatedBy: 'mist',
      cover: { url: firstUrl, width: 750, height: 750, bytes: data.length }
    });
    expect(kept?.cover.updatedAt).toBeInstanceOf(Date);
    const firstPath: string = kept?.cover.path;
    expect(removeCover).not.toHaveBeenCalled();

    // The same cover again lands on itself: nothing to take out.
    snapshot(await store.setCover(id, await square(1000, '#b1272b'), 'candy'));
    expect(removeCover).not.toHaveBeenCalled();

    // A new one takes the old one's place, and the old one goes.
    const second = snapshot(
      await store.setCover(id, await square(800, '#2b27b1'), 'candy')
    );
    expect(coverOf(second)).not.toBe(firstUrl);
    expect(removeCover).toHaveBeenCalledWith(firstPath);
    const secondPath: string = (await stored(id))?.cover.path;

    // An image that can't be a cover changes nothing.
    expect(
      await store.setCover(id, Buffer.from('not an image'), 'candy')
    ).toMatchObject({ ok: false, status: 400, body: { error: 'invalid' } });
    expect(
      await store.setCover(id, await square(200, '#000'), 'candy')
    ).toMatchObject({
      ok: false,
      status: 400,
      body: { message: expect.stringContaining('300×300') }
    });
    expect((await stored(id))?.cover.path).toBe(secondPath);

    // A release that isn't here has no cover to set or clear.
    const gone = '0123456789abcdef01234567';
    const png = await square(400, '#000');
    expect(await store.setCover(gone, png, 'candy')).toMatchObject({
      ok: false,
      status: 404
    });
    expect(await store.setCover('nope', png, 'candy')).toMatchObject({
      ok: false,
      status: 404
    });
    expect(await store.clearCover(gone, 'candy')).toMatchObject({
      ok: false,
      status: 404
    });
    expect(vi.mocked(uploadCover)).toHaveBeenCalledTimes(3);

    // Back to the placeholder: off the release, and out of storage.
    vi.mocked(removeCover).mockClear();
    const cleared = await store.clearCover(id, 'mist');
    expect(cleared).toMatchObject({ ok: true, siteChanged: true });
    expect(coverOf(snapshot(cleared))).toBeNull();
    expect(await stored(id)).not.toHaveProperty('cover');
    expect(removeCover).toHaveBeenCalledWith(secondPath);
    // Cleared again, nothing changes.
    expect(await store.clearCover(id, 'mist')).toMatchObject({
      ok: true,
      siteChanged: false
    });

    // A release removed takes its cover with it.
    snapshot(await store.setCover(id, png, 'candy'));
    const lastPath: string = (await stored(id))?.cover.path;
    vi.mocked(removeCover).mockClear();
    snapshot(await store.removeRelease(id));
    expect(removeCover).toHaveBeenCalledWith(lastPath);
  });
});
