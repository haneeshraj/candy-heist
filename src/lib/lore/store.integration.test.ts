// @vitest-environment node
import { randomUUID } from 'node:crypto';
import { MongoClient, ObjectId } from 'mongodb';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { vi } from 'vitest';
import { presetFor } from '@/lib/planets/engine';
import type { LoreSnapshot } from './model';
import type { LoreOutcome } from './store';

// The lore store against a real MongoDB, opt-in: set TEST_MONGODB_URI to a
// server you don't mind a scratch database on. It makes its own database
// and drops it after, so nothing else on that server is touched.
//
//   TEST_MONGODB_URI=mongodb://127.0.0.1:27017 npx vitest run lore/store.integration

const uri = process.env.TEST_MONGODB_URI;
const name = `candy_heist_itest_${randomUUID().slice(0, 8)}`;

const snapshot = (outcome: LoreOutcome): LoreSnapshot => {
  if (!outcome.ok)
    throw new Error(`Expected ok, got ${JSON.stringify(outcome)}`);
  return outcome.snapshot;
};

const chapter = (patch: object = {}) => ({
  slug: 'omun',
  title: 'Omun',
  line: 'A resonance.',
  body: 'It rises.',
  planet: { id: 'preset:omun', name: 'Omun', spec: presetFor('omun').spec },
  baseRevision: 0,
  ...patch
});

describe.skipIf(!uri)('the lore store, against a real database', () => {
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

  it('publishes, guards and orders the lore', async () => {
    const store = await import('./store');
    const omun = new ObjectId().toHexString();
    const nayara = new ObjectId().toHexString();

    // Nothing published: the site keeps its files.
    expect(await store.loreSnapshot()).toEqual({ live: false, chapters: [] });

    // Text the pages can't show is refused before anything is kept.
    expect(
      await store.publishChapter(omun, chapter({ body: '' }), 'mist')
    ).toMatchObject({ ok: false, status: 400 });

    // The first publish switches the site over.
    const first = await store.publishChapter(omun, chapter(), 'mist');
    expect(first).toMatchObject({ ok: true, siteChanged: true });
    let lore = snapshot(first);
    expect(lore.live).toBe(true);
    expect(lore.chapters).toEqual([
      expect.objectContaining({
        id: omun,
        slug: 'omun',
        planetId: 'preset:omun',
        planetName: 'Omun',
        order: 0,
        revision: 1,
        publishedBy: 'mist'
      })
    ]);

    // A second chapter can't take the first one's address; with its own,
    // it goes last.
    expect(
      await store.publishChapter(nayara, chapter({ title: 'Nayara' }), 'candy')
    ).toMatchObject({ ok: false, status: 409, body: { error: 'slug_taken' } });
    lore = snapshot(
      await store.publishChapter(
        nayara,
        chapter({ slug: 'nayara', title: 'Nayara' }),
        'candy'
      )
    );
    expect(lore.chapters.map((c) => [c.slug, c.order])).toEqual([
      ['omun', 0],
      ['nayara', 1]
    ]);

    // A publish from an older version is refused with the newer one...
    lore = snapshot(
      await store.publishChapter(
        omun,
        chapter({ body: 'It *rises*.', baseRevision: 1 }),
        'mist'
      )
    );
    const stale = await store.publishChapter(
      omun,
      chapter({ body: 'It falls.', baseRevision: 1 }),
      'candy'
    );
    expect(stale).toMatchObject({
      ok: false,
      status: 409,
      body: { error: 'conflict', current: { revision: 2, body: 'It *rises*.' } }
    });
    // ...unless the writer chooses to publish over it.
    lore = snapshot(
      await store.publishChapter(
        omun,
        chapter({ body: 'It falls.', baseRevision: 1, force: true }),
        'candy'
      )
    );
    expect(lore.chapters.find((c) => c.id === omun)).toMatchObject({
      revision: 3,
      body: 'It falls.',
      publishedBy: 'candy'
    });

    // A published chapter keeps its address.
    expect(
      await store.publishChapter(
        omun,
        chapter({ slug: 'omun-renamed', baseRevision: 3 }),
        'mist'
      )
    ).toMatchObject({ ok: false, status: 400 });

    // The order: an out-of-date list is refused; a full one goes live.
    expect(await store.publishOrder({ ids: [nayara] })).toMatchObject({
      ok: false,
      status: 409,
      body: { error: 'out_of_date' }
    });
    lore = snapshot(await store.publishOrder({ ids: [nayara, omun] }));
    expect(lore.chapters.map((c) => c.id)).toEqual([nayara, omun]);

    // Taken down, it's gone from the site; a draft that started from it
    // hears so rather than quietly putting it back.
    const unpublished = await store.unpublishChapter(omun);
    expect(unpublished).toMatchObject({ ok: true, siteChanged: true });
    expect(snapshot(unpublished).chapters.map((c) => c.id)).toEqual([nayara]);
    expect(
      await store.publishChapter(omun, chapter({ baseRevision: 3 }), 'mist')
    ).toMatchObject({
      ok: false,
      status: 409,
      body: { error: 'conflict', current: null }
    });
    expect(await store.unpublishChapter(omun)).toMatchObject({
      ok: true,
      siteChanged: false
    });
  });
});
