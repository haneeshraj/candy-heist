// @vitest-environment node
import { randomUUID } from 'node:crypto';
import { MongoClient } from 'mongodb';
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

  it('writes, guards and publishes the lore', async () => {
    const store = await import('./store');

    // A planet of its own, made from a preset.
    let lore = snapshot(
      await store.createPlanet(
        { name: 'Ember', spec: presetFor('candy').spec },
        'mist'
      )
    );
    expect(lore.planets).toHaveLength(1);
    const ember = lore.planets[0];
    expect(ember).toMatchObject({
      name: 'Ember',
      revision: 1,
      updatedBy: 'mist'
    });

    // Two chapters, the second taking a number for its address.
    lore = snapshot(
      await store.createChapter({ title: 'Omun', planetId: ember.id }, 'mist')
    );
    lore = snapshot(await store.createChapter({ title: 'Omun' }, 'candy'));
    expect(lore.chapters.map((c) => [c.slug, c.order])).toEqual([
      ['omun', 0],
      ['omun-2', 1]
    ]);
    expect(lore.live).toBe(false);
    const [first, second] = lore.chapters;

    // A save from an older revision is refused with the newer one...
    lore = snapshot(
      await store.saveChapter(
        first.id,
        {
          title: 'Omun',
          line: 'A resonance.',
          body: 'It rises.',
          planetId: ember.id,
          baseRevision: 1
        },
        'mist'
      )
    );
    const stale = await store.saveChapter(
      first.id,
      { title: 'Omun?', planetId: ember.id, baseRevision: 1 },
      'candy'
    );
    expect(stale).toMatchObject({
      ok: false,
      status: 409,
      body: { error: 'conflict' }
    });
    // ...unless the writer chooses to overwrite it.
    const forced = snapshot(
      await store.saveChapter(
        first.id,
        {
          title: 'Omun',
          line: 'A resonance.',
          body: 'It *rises*.',
          planetId: ember.id,
          baseRevision: 1,
          force: true
        },
        'candy'
      )
    );
    const saved = forced.chapters.find((c) => c.id === first.id);
    expect(saved).toMatchObject({ revision: 3, updatedBy: 'candy' });

    // Publishing checks the text first, and the version.
    expect(
      await store.publishChapter(second.id, { revision: 1 }, 'mist')
    ).toMatchObject({
      ok: false,
      status: 400
    });
    expect(
      await store.publishChapter(first.id, { revision: 2 }, 'mist')
    ).toMatchObject({
      ok: false,
      status: 409
    });
    const published = await store.publishChapter(
      first.id,
      { revision: 3 },
      'mist'
    );
    expect(published).toMatchObject({ ok: true, siteChanged: true });
    lore = snapshot(published);
    expect(lore.live).toBe(true);
    expect(
      lore.chapters.find((c) => c.id === first.id)?.published
    ).toMatchObject({
      revision: 3,
      planetRevision: 1,
      publishedBy: 'mist'
    });

    // A published chapter keeps its address.
    expect(
      await store.saveChapter(
        first.id,
        {
          title: 'Omun',
          slug: 'omun-renamed',
          planetId: ember.id,
          baseRevision: 3
        },
        'mist'
      )
    ).toMatchObject({ ok: false, status: 400 });

    // Its planet can't be deleted while chapters use it.
    expect(await store.deletePlanet(ember.id)).toMatchObject({
      ok: false,
      status: 409,
      body: { error: 'in_use', chapters: ['Omun'] }
    });

    // The order: an out-of-date list is refused; a full one is kept, and
    // reaches the site only when published.
    expect(await store.reorderChapters({ ids: [second.id] })).toMatchObject({
      ok: false,
      status: 409,
      body: { error: 'out_of_date' }
    });
    lore = snapshot(
      await store.reorderChapters({ ids: [second.id, first.id] })
    );
    expect(lore.chapters.map((c) => c.id)).toEqual([second.id, first.id]);
    expect(lore.chapters.find((c) => c.id === first.id)?.published?.order).toBe(
      0
    );
    lore = snapshot(await store.publishOrder());
    expect(lore.chapters.find((c) => c.id === first.id)?.published?.order).toBe(
      1
    );

    // Unpublishing keeps the draft; deleting takes both.
    const unpublished = await store.unpublishChapter(first.id);
    expect(unpublished).toMatchObject({ ok: true, siteChanged: true });
    expect(
      snapshot(unpublished).chapters.find((c) => c.id === first.id)?.published
    ).toBeNull();
    const deleted = await store.deleteChapter(first.id);
    expect(deleted).toMatchObject({ ok: true, siteChanged: false });
    expect(snapshot(deleted).chapters.map((c) => c.id)).toEqual([second.id]);

    // With nothing using it, the planet can go.
    lore = snapshot(await store.deletePlanet(ember.id));
    expect(lore.planets).toEqual([]);
  });
});
