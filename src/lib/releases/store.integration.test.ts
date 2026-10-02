// @vitest-environment node
import { randomUUID } from 'node:crypto';
import { MongoClient } from 'mongodb';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import type { BatchResult, ReleasesSnapshot } from './model';
import type { ReleasesOutcome } from './store';

// The releases store against a real MongoDB, opt-in: set TEST_MONGODB_URI
// to a server you don't mind a scratch database on. It makes its own
// database and drops it after, so nothing else on that server is touched.
//
//   TEST_MONGODB_URI=mongodb://127.0.0.1:27017 npx vitest run releases/store.integration

const uri = process.env.TEST_MONGODB_URI;
const name = `candy_heist_itest_${randomUUID().slice(0, 8)}`;

function snapshot<T extends ReleasesSnapshot>(outcome: ReleasesOutcome<T>): T {
  if (!outcome.ok)
    throw new Error(`Expected ok, got ${JSON.stringify(outcome)}`);
  return outcome.snapshot;
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

    // A single send before "Publish everything" is refused.
    expect(
      await store.publishRelease({ ref: 'x', fields: release() }, 'candy')
    ).toMatchObject({ ok: false, status: 409 });

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
                status: 'scheduled',
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
    // Not out yet: kept, but not shown until it's switched on.
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

    // Switched on, it shows; the shelf holds what exists, in order.
    const shown = snapshot(
      await store.setVisibility(ep, { shown: true }, 'candy')
    );
    expect(shown.releases.find((r) => r.id === ep)?.visible).toBe(true);
    expect(snapshot(await store.setShelf({ ids: [ep, menace] })).shelf).toEqual(
      [ep, menace]
    );
    expect(
      await store.setShelf({ ids: ['0123456789abcdef01234567'] })
    ).toMatchObject({ ok: false, status: 409 });

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
});
