// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { verifyHavenToken } from '@/lib/haven/auth';
import {
  changeConsultation,
  discardUpload,
  endConsultation,
  feedbackSince,
  listConsultations,
  openConsultation,
  prepareUpload,
  removeConsultation,
  sweepConsultations
} from '@/lib/consult/store';
import { DELETE, PATCH } from './[id]/route';
import { POST as END } from './[id]/end/route';
import { POST as DISCARD } from './discard/route';
import { GET as FEEDBACK } from './feedback/route';
import { GET, POST } from './route';
import { POST as SWEEP } from './sweep/route';
import { POST as UPLOAD } from './upload/route';

// The consultation routes as Haven meets them, with the store and Google's
// keys stood in for, as haven.test.ts does for the inbox: who gets in, and
// that each route hands its one job to the store and its answer back.

vi.mock('@/lib/haven/auth', async (actual) => ({
  ...(await actual<typeof import('@/lib/haven/auth')>()),
  getGoogleKeys: vi.fn(),
  verifyHavenToken: vi.fn()
}));
vi.mock('@/lib/forms/limits', () => ({
  withinHourlyLimit: vi.fn().mockResolvedValue(true)
}));
vi.mock('@/lib/consult/store', () => ({
  listConsultations: vi.fn(),
  openConsultation: vi.fn(),
  changeConsultation: vi.fn(),
  endConsultation: vi.fn(),
  removeConsultation: vi.fn(),
  feedbackSince: vi.fn(),
  prepareUpload: vi.fn(),
  discardUpload: vi.fn(),
  sweepConsultations: vi.fn()
}));

const storage = { configured: true, usedBytes: 0, limitBytes: 1024 ** 3 };

const id = '0123456789abcdef01234567';
const context = { params: Promise.resolve({ id }) };
const request = (url: string, init?: RequestInit) =>
  new Request(`https://candy-heist.test${url}`, {
    ...init,
    headers: { authorization: 'Bearer a.b.c', ...init?.headers }
  });
const json = (method: string, body: unknown) => ({
  method,
  body: JSON.stringify(body),
  headers: { 'content-type': 'application/json' }
});

describe('Candy Haven’s consultation routes', () => {
  beforeEach(() => {
    vi.stubEnv('FIREBASE_PROJECT_ID', 'candy-haven-test');
    vi.stubEnv('HAVEN_ALLOWED_UIDS', 'candy-uid');
    vi.mocked(verifyHavenToken).mockResolvedValue({
      ok: true,
      uid: 'candy-uid'
    });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  it('turns away a request without a real sign-in, before any data', async () => {
    vi.mocked(verifyHavenToken).mockResolvedValue({ ok: false, status: 401 });
    expect((await GET(request('/api/haven/consultations'))).status).toBe(401);
    expect((await POST(request('/x', json('POST', {})))).status).toBe(401);
    expect((await END(request('/x', { method: 'POST' }), context)).status).toBe(
      401
    );
    expect((await FEEDBACK(request('/x'))).status).toBe(401);
    expect((await UPLOAD(request('/x', json('POST', {})))).status).toBe(401);
    expect((await DISCARD(request('/x', json('POST', {})))).status).toBe(401);
    expect((await SWEEP(request('/x', { method: 'POST' }))).status).toBe(401);
    expect(listConsultations).not.toHaveBeenCalled();
    expect(openConsultation).not.toHaveBeenCalled();
    expect(endConsultation).not.toHaveBeenCalled();
    expect(feedbackSince).not.toHaveBeenCalled();
    expect(prepareUpload).not.toHaveBeenCalled();
    expect(discardUpload).not.toHaveBeenCalled();
    expect(sweepConsultations).not.toHaveBeenCalled();
  });

  it('turns away any account but the two', async () => {
    vi.mocked(verifyHavenToken).mockResolvedValue({ ok: false, status: 403 });
    expect((await GET(request('/api/haven/consultations'))).status).toBe(403);
  });

  it('lists every consultation, and the room left, uncached', async () => {
    vi.mocked(listConsultations).mockResolvedValue({
      consultations: [],
      storage
    });
    const response = await GET(request('/api/haven/consultations'));
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(await response.json()).toEqual({ consultations: [], storage });
  });

  it('gives a pass for an upload, or says why not', async () => {
    const ask = { extension: 'wav', contentType: 'audio/wav', bytes: 1000 };
    vi.mocked(prepareUpload).mockResolvedValue({
      ok: true,
      body: {
        pathname: 'consultation-dev/a.wav',
        token: 'vercel_blob_client_test',
        validUntil: '2026-10-10T13:00:00.000Z'
      }
    });
    const given = await UPLOAD(request('/x', json('POST', ask)));
    expect(given.status).toBe(200);
    expect(prepareUpload).toHaveBeenCalledWith(ask);
    expect(await given.json()).toMatchObject({
      token: 'vercel_blob_client_test'
    });

    vi.mocked(prepareUpload).mockResolvedValue({
      ok: false,
      status: 409,
      body: { error: 'no_room', message: 'There isn’t room for this track.' }
    });
    const full = await UPLOAD(request('/x', json('POST', ask)));
    expect(full.status).toBe(409);
    expect(await full.json()).toEqual({
      error: 'no_room',
      message: 'There isn’t room for this track.'
    });
  });

  it('discards an upload whose link never opened', async () => {
    vi.mocked(discardUpload).mockResolvedValue({ ok: true, body: null });
    const response = await DISCARD(
      request('/x', json('POST', { pathname: 'consultation-dev/a.wav' }))
    );
    expect(response.status).toBe(204);
    expect(discardUpload).toHaveBeenCalledWith({
      pathname: 'consultation-dev/a.wav'
    });
  });

  it('sweeps on request, then answers with the list as it stands', async () => {
    vi.mocked(sweepConsultations).mockResolvedValue({ deleted: 1, orphans: 0 });
    vi.mocked(listConsultations).mockResolvedValue({
      consultations: [],
      storage
    });
    const response = await SWEEP(request('/x', { method: 'POST' }));
    expect(response.status).toBe(200);
    expect(sweepConsultations).toHaveBeenCalledOnce();
    expect(await response.json()).toEqual({ consultations: [], storage });
  });

  it('opens a link with the body Haven sent, as the account that sent it', async () => {
    vi.mocked(openConsultation).mockResolvedValue({
      ok: true,
      body: { id } as never
    });
    const response = await POST(
      request('/x', json('POST', { title: 'Menace' }))
    );
    expect(response.status).toBe(200);
    expect(openConsultation).toHaveBeenCalledWith(
      { title: 'Menace' },
      'candy-uid'
    );
  });

  it('answers a body that isn’t JSON with 400, without opening anything', async () => {
    const response = await POST(
      request('/x', { method: 'POST', body: 'not json' })
    );
    expect(response.status).toBe(400);
    expect(openConsultation).not.toHaveBeenCalled();
  });

  it('passes the store’s refusal on as it is', async () => {
    vi.mocked(changeConsultation).mockResolvedValue({
      ok: false,
      status: 409,
      body: { error: 'closed', message: 'This link has closed.' }
    });
    const response = await PATCH(
      request('/x', json('PATCH', { expiresAt: '2026-10-12T00:00:00Z' })),
      context
    );
    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({
      error: 'closed',
      message: 'This link has closed.'
    });
    expect(changeConsultation).toHaveBeenCalledWith(id, {
      expiresAt: '2026-10-12T00:00:00Z'
    });
  });

  it('closes a link early, and forgets one with no content left', async () => {
    vi.mocked(endConsultation).mockResolvedValue({
      ok: true,
      body: { id } as never
    });
    expect((await END(request('/x', { method: 'POST' }), context)).status).toBe(
      200
    );
    expect(endConsultation).toHaveBeenCalledWith(id);

    vi.mocked(removeConsultation).mockResolvedValue({ ok: true, body: null });
    const removed = await DELETE(request('/x', { method: 'DELETE' }), context);
    expect(removed.status).toBe(204);
    expect(removeConsultation).toHaveBeenCalledWith(id);
  });

  it('hands over feedback since Haven last asked', async () => {
    vi.mocked(feedbackSince).mockResolvedValue({
      feedback: [],
      cursor: '2026-10-10T12:00:00.000Z',
      more: false
    });
    const response = await FEEDBACK(
      request(
        '/api/haven/consultations/feedback?since=2026-10-10T11:00:00.000Z'
      )
    );
    expect(response.status).toBe(200);
    expect(feedbackSince).toHaveBeenCalledWith(
      new Date('2026-10-10T11:00:00.000Z')
    );
  });

  it('refuses a `since` that isn’t a date', async () => {
    const response = await FEEDBACK(
      request('/api/haven/consultations/feedback?since=yesterday')
    );
    expect(response.status).toBe(400);
    expect(feedbackSince).not.toHaveBeenCalled();
  });

  it('has no way for anyone to read feedback but through the sign-in', async () => {
    // The only route that reads feedback is behind admitHaven, and the
    // page's own action only ever files it.
    const action = await import('@/lib/consult/submit');
    expect(Object.keys(action)).toEqual(['submitFeedback']);
  });
});
