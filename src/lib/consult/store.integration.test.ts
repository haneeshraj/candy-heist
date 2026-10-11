// @vitest-environment node
import { randomUUID } from 'node:crypto';
import { MongoClient } from 'mongodb';
import { del, list } from '@vercel/blob';
import { generateClientTokenFromReadWriteToken } from '@vercel/blob/client';
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi
} from 'vitest';
import { compactPeaks, emptyChain, encodeWaveform, newBand } from './engine';

// The store against a real MongoDB, opt-in, as the inbox's is: set
// TEST_MONGODB_URI to a server you don't mind a scratch database on. It
// makes its own database and drops it after.
//
//   TEST_MONGODB_URI=mongodb://127.0.0.1:27017 npx vitest run consult/store.integration
//
// The TTL indexes do the deleting in production, a minute or so after a
// link closes; these tests check the store already treats a closed link as
// closed in that minute, which is what a visitor or Haven would meet. The
// Blob store is stood in for: what's checked is what the site asks of it.

vi.mock('next/headers', () => ({
  headers: async () => new Headers({ 'x-forwarded-for': '203.0.113.9' })
}));
vi.mock('@vercel/blob', () => ({
  BlobNotFoundError: class BlobNotFoundError extends Error {},
  del: vi.fn(async () => undefined),
  list: vi.fn(async () => ({ blobs: [], hasMore: false }))
}));
vi.mock('@vercel/blob/client', () => ({
  generateClientTokenFromReadWriteToken: vi.fn(
    async () => 'vercel_blob_client_test'
  )
}));

const uri = process.env.TEST_MONGODB_URI;
const name = `candy_heist_itest_${randomUUID().slice(0, 8)}`;

const HOUR = 3600_000;
const DAY = 24 * HOUR;
const MB = 1024 * 1024;
const STORE = 'https://store1.public.blob.vercel-storage.com';

/** A track's audio as Haven sends it, in this copy's folder. */
const track = (file: string, bytes = 50 * MB) => ({
  path: `consultation-dev/${file}`,
  url: `${STORE}/consultation-dev/${file}`,
  bytes,
  contentType: 'audio/wav'
});

const opening = {
  title: 'Menace',
  message: 'Is the drop too dark?',
  durationMs: 200_000,
  bpm: 124,
  days: 3,
  audio: track('abc.wav'),
  waveform: encodeWaveform(compactPeaks(new Float32Array(300)))
};

const feedback = {
  name: 'Nasko',
  notes: [{ id: 'n1', at: 83, end: null, text: 'More high end', chain: null }],
  chain: { ...emptyChain(), eq: [{ ...newBand('b1', 'bell', 1500), gain: 4 }] }
};

describe.skipIf(!uri)('the consultation store, against a real database', () => {
  let mongo: MongoClient;

  beforeAll(async () => {
    vi.stubEnv('MONGODB_URI', uri ?? '');
    vi.stubEnv('MONGODB_DB', name);
    vi.stubEnv('VERCEL_ENV', 'development');
    mongo = await new MongoClient(uri ?? '').connect();
  });

  beforeEach(async () => {
    vi.stubEnv('BLOB_READ_WRITE_TOKEN', 'vercel_blob_rw_test');
    vi.clearAllMocks();
    // Each test starts from no consultations at all.
    for (const collection of [
      'consultations',
      'consultation_access',
      'consultation_feedback'
    ])
      await mongo.db(name).collection(collection).deleteMany({});
  });

  afterAll(async () => {
    await mongo.db(name).dropDatabase();
    await mongo.close();
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
    expect(opened.body.audio.url).toBe(opening.audio.url);

    const room = await store.findRoom(token, now);
    expect(room).toMatchObject({
      title: 'Menace',
      bpm: 124,
      durationMs: 200_000,
      audioUrl: opening.audio.url
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
    // Its track still counts until it's swept.
    expect(listed.storage).toMatchObject({
      configured: true,
      usedBytes: 50 * MB,
      limitBytes: 1024 * MB
    });
  });

  it('closes early, deleting the track, keeps the record, and forgets it on request', async () => {
    const store = await import('./store');
    const now = new Date('2026-10-10T12:00:00Z');
    const opened = await store.openConsultation(opening, 'candy-uid', now);
    if (!opened.ok) throw new Error('not opened');
    const token = (opened.body.link ?? '').split('/').at(-1) ?? '';
    await store.fileFeedback(token, feedback, now);

    const ended = await store.endConsultation(opened.body.id, now);
    expect(ended).toMatchObject({
      ok: true,
      body: {
        link: null,
        waveform: null,
        feedbackCount: 0,
        audioDeletedAt: now.toISOString()
      }
    });
    expect(del).toHaveBeenCalledWith(opening.audio.url);
    expect(await store.findRoom(token, now)).toBeNull();
    expect((await store.listConsultations(now)).storage.usedBytes).toBe(0);

    const reopen = await store.changeConsultation(
      opened.body.id,
      { expiresAt: new Date(now.getTime() + DAY).toISOString() },
      now
    );
    expect(reopen).toMatchObject({ ok: false, status: 409 });

    vi.mocked(del).mockClear();
    expect((await store.removeConsultation(opened.body.id, now)).ok).toBe(true);
    // Deleted already when it was ended: not asked for again.
    expect(del).not.toHaveBeenCalled();
    const listed = await store.listConsultations(now);
    expect(listed.consultations.map((c) => c.id)).not.toContain(opened.body.id);
  });

  it('gives a pass for one upload while there is room, and not after', async () => {
    const store = await import('./store');
    const now = new Date('2026-10-10T12:00:00Z');

    const pass = await store.prepareUpload(
      { extension: 'wav', contentType: 'audio/wav', bytes: 10 * MB },
      now
    );
    expect(pass.ok).toBe(true);
    if (!pass.ok) return;
    expect(pass.body.pathname).toMatch(/^consultation-dev\/[\da-f-]{36}\.wav$/);
    expect(pass.body.token).toBe('vercel_blob_client_test');
    expect(generateClientTokenFromReadWriteToken).toHaveBeenCalledWith(
      expect.objectContaining({
        pathname: pass.body.pathname,
        allowedContentTypes: ['audio/wav'],
        maximumSizeInBytes: 10 * MB,
        validUntil: now.getTime() + HOUR,
        addRandomSuffix: false,
        allowOverwrite: false
      })
    );

    // Five tracks at the 200 MB limit leave about 24 MB of the gigabyte.
    for (const file of ['1.wav', '2.wav', '3.wav', '4.wav', '5.wav'])
      await store.openConsultation(
        { ...opening, audio: track(file, 200 * MB) },
        'candy-uid',
        now
      );
    const full = await store.prepareUpload(
      { extension: 'wav', contentType: 'audio/wav', bytes: 50 * MB },
      now
    );
    expect(full).toMatchObject({
      ok: false,
      status: 409,
      body: { error: 'no_room' }
    });
    expect(full.ok ? '' : full.body.message).toContain('24 MB');

    vi.stubEnv('BLOB_READ_WRITE_TOKEN', '');
    expect(
      await store.prepareUpload(
        { extension: 'mp3', contentType: 'audio/mpeg', bytes: MB },
        now
      )
    ).toMatchObject({ ok: false, status: 409, body: { error: 'no_store' } });
  });

  it('sweeps closed links’ tracks, and uploads whose link never opened', async () => {
    const store = await import('./store');
    const now = new Date('2026-10-10T12:00:00Z');
    const closing = await store.openConsultation(
      { ...opening, days: 1, audio: track('closing.wav') },
      'candy-uid',
      now
    );
    const staying = await store.openConsultation(
      { ...opening, days: 7, audio: track('staying.wav') },
      'candy-uid',
      now
    );
    if (!closing.ok || !staying.ok) throw new Error('not opened');

    const later = new Date(now.getTime() + 2 * DAY);
    vi.mocked(list).mockResolvedValue({
      blobs: [
        // An upload whose link never opened, a day old.
        {
          url: `${STORE}/consultation-dev/abandoned.wav`,
          pathname: 'consultation-dev/abandoned.wav',
          uploadedAt: new Date(later.getTime() - DAY)
        },
        // One still being uploaded, a minute ago.
        {
          url: `${STORE}/consultation-dev/arriving.wav`,
          pathname: 'consultation-dev/arriving.wav',
          uploadedAt: new Date(later.getTime() - 60_000)
        },
        // An open link's.
        {
          url: `${STORE}/consultation-dev/staying.wav`,
          pathname: 'consultation-dev/staying.wav',
          uploadedAt: now
        }
      ],
      hasMore: false
    } as never);

    // Haven's sweep: closed links only, no listing of the store.
    expect(await store.sweepConsultations(later)).toEqual({
      deleted: 1,
      orphans: 0
    });
    expect(list).not.toHaveBeenCalled();
    expect(del).toHaveBeenCalledWith(`${STORE}/consultation-dev/closing.wav`);

    // The daily one: the abandoned upload too, and nothing else.
    vi.mocked(del).mockClear();
    expect(await store.sweepConsultations(later, { orphans: true })).toEqual({
      deleted: 0,
      orphans: 1
    });
    expect(list).toHaveBeenCalledWith(
      expect.objectContaining({ prefix: 'consultation-dev/' })
    );
    expect(del).toHaveBeenCalledTimes(1);
    expect(del).toHaveBeenCalledWith(`${STORE}/consultation-dev/abandoned.wav`);

    const listed = await store.listConsultations(later);
    expect(listed.storage.usedBytes).toBe(50 * MB);
    const swept = listed.consultations.find((c) => c.id === closing.body.id);
    expect(swept?.audioDeletedAt).toBe(later.toISOString());
  });

  it('discards an upload only when no link plays it', async () => {
    const store = await import('./store');
    const now = new Date('2026-10-10T12:00:00Z');
    await store.openConsultation(opening, 'candy-uid', now);

    expect(
      await store.discardUpload({ pathname: opening.audio.path })
    ).toMatchObject({ ok: false, status: 409, body: { error: 'in_use' } });
    expect(
      await store.discardUpload({ pathname: 'consultation/live.wav' })
    ).toMatchObject({ ok: false, status: 400 });
    expect(del).not.toHaveBeenCalled();

    expect(
      (await store.discardUpload({ pathname: 'consultation-dev/spare.wav' })).ok
    ).toBe(true);
    expect(del).toHaveBeenCalledWith('consultation-dev/spare.wav');
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
    const elsewhere = await store.openConsultation(
      {
        ...opening,
        audio: { ...opening.audio, url: 'https://evil.example/x.wav' }
      },
      'candy-uid'
    );
    expect(elsewhere).toMatchObject({ ok: false, status: 400 });
    expect(await store.changeConsultation('nope', {})).toMatchObject({
      status: 404
    });
  });
});
