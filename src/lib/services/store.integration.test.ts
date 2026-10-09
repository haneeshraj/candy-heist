// @vitest-environment node
import { randomUUID } from 'node:crypto';
import { MongoClient } from 'mongodb';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { fileServices } from '@/content/services/catalogue';
import { fileHours } from '@/content/services/hours';
import { publishedHoursOf, type ServicesSnapshot } from './model';
import type { ServicesOutcome } from './store';

// The services store against a real MongoDB, opt-in: set TEST_MONGODB_URI
// to a server you don't mind a scratch database on. It makes its own
// database and drops it after, so nothing else on that server is touched.
//
//   TEST_MONGODB_URI=mongodb://127.0.0.1:27017 npx vitest run services/store.integration

const uri = process.env.TEST_MONGODB_URI;
const name = `candy_heist_itest_${randomUUID().slice(0, 8)}`;

const snapshot = (outcome: ServicesOutcome): ServicesSnapshot => {
  if (!outcome.ok)
    throw new Error(`Expected ok, got ${JSON.stringify(outcome)}`);
  return outcome.body;
};

const hours = publishedHoursOf(fileHours);
const [mixing, mastering] = fileServices;

describe.skipIf(!uri)('the services store, against a real database', () => {
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

  it('publishes the list whole, and guards it between two copies of Haven', async () => {
    const store = await import('./store');

    // Nothing published: the site offers its own list, from revision 0.
    const before = await store.servicesSnapshot();
    expect(before).toMatchObject({ live: false, revision: 0 });
    expect(before.items.map((item) => item.id)).toEqual(
      fileServices.map((item) => item.id)
    );

    // A write-up the pages can't show is refused before anything is kept.
    expect(
      await store.publishServices(
        {
          items: [{ ...mixing, body: '| a | b |\n|---|---|\n| 1 | 2 |' }],
          hours,
          baseRevision: 0
        },
        'mist'
      )
    ).toMatchObject({ ok: false, status: 400 });

    // The first publish switches the site over.
    const first = snapshot(
      await store.publishServices(
        { items: [mixing], hours, baseRevision: 0 },
        'mist'
      )
    );
    expect(first).toMatchObject({
      live: true,
      revision: 1,
      publishedBy: 'mist'
    });
    expect(first.items.map((item) => item.id)).toEqual(['mixing']);

    // The other copy, still on revision 0, is told what's there now.
    const stale = await store.publishServices(
      { items: [mastering], hours, baseRevision: 0 },
      'candy'
    );
    expect(stale).toMatchObject({ ok: false, status: 409 });
    expect(
      !stale.ok &&
        (stale.body.current as ServicesSnapshot).items.map((item) => item.id)
    ).toEqual(['mixing']);

    // From the right revision, or told to, it goes through.
    const second = snapshot(
      await store.publishServices(
        { items: [mastering, mixing], hours, baseRevision: 1 },
        'candy'
      )
    );
    expect(second.revision).toBe(2);
    expect(second.items.map((item) => item.id)).toEqual([
      'mastering',
      'mixing'
    ]);
    const forced = snapshot(
      await store.publishServices(
        { items: [mixing], hours, baseRevision: 0, force: true },
        'mist'
      )
    );
    expect(forced).toMatchObject({ revision: 3, publishedBy: 'mist' });
  });
});
