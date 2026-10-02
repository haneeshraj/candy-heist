// @vitest-environment node
import { randomUUID } from 'node:crypto';
import { MongoClient, ObjectId } from 'mongodb';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

// The store against a real MongoDB, opt-in: set TEST_MONGODB_URI to a
// server you don't mind a scratch database on. It makes its own database
// and drops it after, so nothing else on that server is touched.
//
//   TEST_MONGODB_URI=mongodb://127.0.0.1:27017 npx vitest run store.integration

vi.mock('next/headers', () => ({
  headers: async () => new Headers({ 'x-forwarded-for': '203.0.113.9' })
}));

const uri = process.env.TEST_MONGODB_URI;
const name = `candy_heist_itest_${randomUUID().slice(0, 8)}`;

describe.skipIf(!uri)('the store, against a real database', () => {
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

  const message = {
    name: 'Alex',
    email: 'alex@nightfall.events',
    subject: 'A set in July',
    message: 'Three Saturdays on a rooftop.',
    phone: '',
    organisation: '',
    date: '',
    location: '',
    budget: '',
    links: ''
  };

  it('files, hands over, moves along and deletes', async () => {
    const { changesSince, deleteFiled, fileMessage, setStatus } =
      await import('./store');
    const before = new Date();
    const ref = await fileMessage(message);
    expect(ref).toMatch(/^MSG-/);

    const first = await changesSince(new Date(0));
    expect(first.messages).toHaveLength(1);
    expect(first.messages[0]).toMatchObject({
      ref,
      status: 'new',
      name: 'Alex'
    });
    expect(new Date(first.cursor).getTime()).toBeGreaterThanOrEqual(
      before.getTime() - 5
    );

    const id = new ObjectId(first.messages[0].id);
    await expect(setStatus('message', id, 'replied')).resolves.toBe(true);
    const moved = await changesSince(new Date(first.cursor));
    expect(moved.messages[0].status).toBe('replied');

    await deleteFiled('message', id);
    const gone = await changesSince(new Date(moved.cursor));
    expect(gone.messages).toHaveLength(0);
    expect(gone.deletions).toEqual([
      expect.objectContaining({ kind: 'message', id: id.toHexString() })
    ]);
    await expect(setStatus('message', id, 'read')).resolves.toBe(false);
  });

  it('holds a visitor to the hourly limit', async () => {
    const { withinHourlyLimit } = await import('@/lib/forms/limits');
    const answers = [];
    for (let i = 0; i < 4; i++)
      answers.push(await withinHourlyLimit('itest', 3));
    expect(answers).toEqual([true, true, true, false]);
  });

  it('files an enquiry under its own ref', async () => {
    const { changesSince, fileEnquiry } = await import('./store');
    const ref = await fileEnquiry({
      name: 'Alex Martin',
      title: 'Booking agent',
      email: 'alex@nightfall.events',
      phone: '',
      eventName: 'Rooftop Series',
      eventVenue: '',
      budget: '$1,500',
      about: 'Three Saturdays in July.'
    });
    expect(ref).toMatch(/^DJ-/);
    const changes = await changesSince(new Date(0));
    expect(changes.enquiries[0]).toMatchObject({ ref, status: 'new' });
  });
});
