// @vitest-environment node
import { randomUUID } from 'node:crypto';
import { MongoClient } from 'mongodb';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { compactPeaks, emptyChain, encodeWaveform, newBand } from './engine';

// The store against a real MongoDB, opt-in, as the inbox's is: set
// TEST_MONGODB_URI to a server you don't mind a scratch database on. It
// makes its own database and drops it after.
//
//   TEST_MONGODB_URI=mongodb://127.0.0.1:27017 npx vitest run consult/store.integration
//
// The TTL indexes do the deleting in production, a minute or so after a
// link closes; these tests check the store already treats a closed link as
// closed in that minute, which is what a visitor or Haven would meet.

vi.mock('next/headers', () => ({
  headers: async () => new Headers({ 'x-forwarded-for': '203.0.113.9' })
}));

const uri = process.env.TEST_MONGODB_URI;
const name = `candy_heist_itest_${randomUUID().slice(0, 8)}`;

const HOUR = 3600_000;
const DAY = 24 * HOUR;

const opening = {
  title: 'Menace',
  message: 'Is the drop too dark?',
  durationMs: 200_000,
  bpm: 124,
  days: 3,
  audio: {
    path: 'consultation/abc.wav',
    url: 'https://firebasestorage.googleapis.com/v0/b/candy/o/consultation%2Fabc.wav?alt=media&token=t',
    bytes: 50_000_000,
    contentType: 'audio/wav'
  },
  waveform: encodeWaveform(compactPeaks(new Float32Array(300)))
};

const feedback = {
  name: 'Nasko',
  notes: [{ id: 'n1', at: 83, end: null, text: 'More high end', chain: null }],
  chain: { ...emptyChain(), eq: [{ ...newBand('b1', 'bell', 1500), gain: 4 }] }
};

describe.skipIf(!uri)('the consultation store, against a real database', () => {
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

  it('opens a link, files feedback on it, and closes it to a record', async () => {
    const store = await import('./store');
    const now = new Date('2026-10-10T12:00:00Z');

    const opened = await store.openConsultation(opening, 'candy-uid', now);
    expect(opened.ok).toBe(true);
    if (!opened.ok) return;
    const { id, link } = opened.body;
    expect(link).toMatch(/\/consult\/[\w-]{43}$/);
    const token = (link ?? '').split('/').at(-1) ?? '';
    expect(opened.body.expiresAt).toBe(
      new Date(now.getTime() + 3 * DAY).toISOString()
    );
    expect(opened.body.waveform).toBe(opening.waveform);

    const room = await store.findRoom(token, now);
    expect(room).toMatchObject({
      title: 'Menace',
      bpm: 124,
      durationMs: 200_000
    });
    expect(await store.findRoom('b'.repeat(43), now)).toBeNull();

    expect(await store.fileFeedback(token, feedback, now)).toBe(true);
    const pulled = await store.feedbackSince(new Date(0), now);
    expect(pulled.feedback).toHaveLength(1);
    expect(pulled.feedback[0]).toMatchObject({
      consultationId: id,
      name: 'Nasko'
    });

    // Moved later, within the week; not past it, and not into the past.
    const later = new Date(now.getTime() + 6 * DAY).toISOString();
    expect(
      (await store.changeConsultation(id, { expiresAt: later }, now)).ok
    ).toBe(true);
    const past = await store.changeConsultation(
      id,
      { expiresAt: new Date(now.getTime() + 8 * DAY).toISOString() },
      now
    );
    expect(past).toMatchObject({ ok: false, status: 400 });

    // In the minute before the TTL catches up, a closed link reads closed.
    const after = new Date(now.getTime() + 6 * DAY + 1000);
    expect(await store.findRoom(token, after)).toBeNull();
    expect(await store.fileFeedback(token, feedback, after)).toBe(false);
    expect(
      (await store.feedbackSince(new Date(0), after)).feedback
    ).toHaveLength(0);
    const listed = await store.listConsultations(after);
    expect(listed.consultations[0]).toMatchObject({
      id,
      link: null,
      waveform: null,
      feedbackCount: 0
    });
  });

  it('closes early, keeps the record, and forgets it on request', async () => {
    const store = await import('./store');
    const now = new Date('2026-10-10T12:00:00Z');
    const opened = await store.openConsultation(opening, 'candy-uid', now);
    if (!opened.ok) throw new Error('not opened');
    const token = (opened.body.link ?? '').split('/').at(-1) ?? '';
    await store.fileFeedback(token, feedback, now);

    const ended = await store.endConsultation(opened.body.id, now);
    expect(ended).toMatchObject({
      ok: true,
      body: { link: null, waveform: null, feedbackCount: 0 }
    });
    expect(await store.findRoom(token, now)).toBeNull();
    const reopen = await store.changeConsultation(
      opened.body.id,
      { expiresAt: new Date(now.getTime() + DAY).toISOString() },
      now
    );
    expect(reopen).toMatchObject({ ok: false, status: 409 });

    const deleted = await store.changeConsultation(
      opened.body.id,
      { audioDeletedAt: now.toISOString() },
      now
    );
    expect(deleted).toMatchObject({
      ok: true,
      body: { audioDeletedAt: now.toISOString() }
    });

    expect((await store.removeConsultation(opened.body.id)).ok).toBe(true);
    const listed = await store.listConsultations(now);
    expect(listed.consultations.map((c) => c.id)).not.toContain(opened.body.id);
  });

  it('refuses what Haven wouldn’t send', async () => {
    const store = await import('./store');
    const wrong = await store.openConsultation(
      { ...opening, days: 9 },
      'candy-uid'
    );
    expect(wrong).toMatchObject({ ok: false, status: 400 });
    const notWaveform = await store.openConsultation(
      { ...opening, waveform: 'not base64!' },
      'candy-uid'
    );
    expect(notWaveform).toMatchObject({ ok: false, status: 400 });
    expect(await store.changeConsultation('nope', {})).toMatchObject({
      status: 404
    });
  });
});
