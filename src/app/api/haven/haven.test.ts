// @vitest-environment node
import { ObjectId } from 'mongodb';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { verifyHavenToken } from '@/lib/haven/auth';
import { changesSince, deleteFiled } from '@/lib/inbox/store';
import { GET } from './inbox/route';
import { DELETE } from './messages/[id]/route';

// The routes as Haven meets them, with the database and Google's keys
// stood in for. Who gets in is tested properly in auth.test.ts; here the
// verdict is set by hand, to see each route keep its side of it.

vi.mock('@/lib/haven/auth', async (actual) => ({
  ...(await actual<typeof import('@/lib/haven/auth')>()),
  getGoogleKeys: vi.fn(),
  verifyHavenToken: vi.fn()
}));
vi.mock('@/lib/forms/limits', () => ({
  withinHourlyLimit: vi.fn().mockResolvedValue(true)
}));
vi.mock('@/lib/inbox/store', async (actual) => ({
  ...(await actual<typeof import('@/lib/inbox/store')>()),
  changesSince: vi.fn(),
  deleteFiled: vi.fn()
}));

const id = new ObjectId().toHexString();
const context = { params: Promise.resolve({ id }) };
const request = (url: string, init?: RequestInit) =>
  new Request(`https://candy-heist.test${url}`, {
    ...init,
    headers: { authorization: 'Bearer a.b.c', ...init?.headers }
  });

describe('Candy Haven’s API', () => {
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

  it('answers nobody until it knows who to let in', async () => {
    vi.stubEnv('HAVEN_ALLOWED_UIDS', '');
    const response = await GET(request('/api/haven/inbox'));
    expect(response.status).toBe(503);
    expect(changesSince).not.toHaveBeenCalled();
  });

  it('turns away a request without a real sign-in, before any data', async () => {
    vi.mocked(verifyHavenToken).mockResolvedValue({ ok: false, status: 401 });
    expect((await GET(request('/api/haven/inbox'))).status).toBe(401);
    expect(
      (await DELETE(request('/x', { method: 'DELETE' }), context)).status
    ).toBe(401);
    expect(changesSince).not.toHaveBeenCalled();
    expect(deleteFiled).not.toHaveBeenCalled();
  });

  it('turns away any account but the two', async () => {
    vi.mocked(verifyHavenToken).mockResolvedValue({ ok: false, status: 403 });
    expect((await GET(request('/api/haven/inbox'))).status).toBe(403);
  });

  it('hands over what changed since Haven last asked, uncached', async () => {
    vi.mocked(changesSince).mockResolvedValue({
      messages: [],
      enquiries: [],
      deletions: [],
      cursor: '2026-10-01T12:00:00.000Z',
      more: false
    });
    const response = await GET(
      request('/api/haven/inbox?since=2026-10-01T11:00:00.000Z')
    );
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(changesSince).toHaveBeenCalledWith(
      new Date('2026-10-01T11:00:00.000Z')
    );
  });

  it('refuses a `since` that isn’t a date', async () => {
    expect(
      (await GET(request('/api/haven/inbox?since=yesterday'))).status
    ).toBe(400);
  });

  it('has no way to set a status: that stays in Haven', async () => {
    const routes = await import('./messages/[id]/route');
    expect(routes).not.toHaveProperty('PATCH');
    expect(await import('./enquiries/[id]/route')).not.toHaveProperty('PATCH');
  });

  it('deletes a message for good', async () => {
    const response = await DELETE(request('/x', { method: 'DELETE' }), context);
    expect(response.status).toBe(204);
    expect(deleteFiled).toHaveBeenCalledWith('message', expect.any(ObjectId));
  });

  it('treats an id that couldn’t be one as not found', async () => {
    const response = await DELETE(request('/x', { method: 'DELETE' }), {
      params: Promise.resolve({ id: 'drop table' })
    });
    expect(response.status).toBe(404);
    expect(deleteFiled).not.toHaveBeenCalled();
  });
});
