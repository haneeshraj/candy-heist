// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { verifyHavenToken } from '@/lib/haven/auth';
import { revalidateLore } from '@/lib/lore/revalidate';
import {
  loreSnapshot,
  publishChapter,
  publishOrder,
  unpublishChapter,
  type LoreOutcome
} from '@/lib/lore/store';
import { GET } from './route';
import { DELETE as UNPUBLISH, PUT as PUBLISH } from './chapters/[id]/route';
import { PUT as ORDER } from './order/route';

// The lore routes as Candy Haven meets them, with the store and Google's
// keys stood in for: who gets in, what each passes on, and that the
// site's pages are made again only when the published lore changed.

vi.mock('@/lib/haven/auth', async (actual) => ({
  ...(await actual<typeof import('@/lib/haven/auth')>()),
  getGoogleKeys: vi.fn(),
  verifyHavenToken: vi.fn()
}));
vi.mock('@/lib/forms/limits', () => ({
  withinHourlyLimit: vi.fn().mockResolvedValue(true)
}));
vi.mock('@/lib/lore/revalidate', () => ({ revalidateLore: vi.fn() }));
vi.mock('@/lib/lore/store', () => ({
  loreSnapshot: vi.fn(),
  publishChapter: vi.fn(),
  unpublishChapter: vi.fn(),
  publishOrder: vi.fn()
}));

const ID = '6650f0f0f0f0f0f0f0f0f0f0';
const context = { params: Promise.resolve({ id: ID }) };
const snapshot = { live: false, chapters: [] };
const ok = (siteChanged = false): LoreOutcome => ({
  ok: true,
  snapshot,
  siteChanged
});

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

describe('the lore API', () => {
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

  it('lets nobody in without one of the two sign-ins', async () => {
    vi.mocked(verifyHavenToken).mockResolvedValue({ ok: false, status: 401 });
    expect((await GET(request('/api/haven/lore'))).status).toBe(401);
    expect(
      (await PUBLISH(request('/x', json('PUT', { title: 'A' })), context))
        .status
    ).toBe(401);
    expect(
      (await UNPUBLISH(request('/x', { method: 'DELETE' }), context)).status
    ).toBe(401);
    expect(loreSnapshot).not.toHaveBeenCalled();
    expect(publishChapter).not.toHaveBeenCalled();
    expect(unpublishChapter).not.toHaveBeenCalled();
  });

  it('hands over what’s published, uncached', async () => {
    vi.mocked(loreSnapshot).mockResolvedValue(snapshot);
    const response = await GET(request('/api/haven/lore'));
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(await response.json()).toEqual(snapshot);
  });

  it('passes a chapter on with who published it, and answers with the lore', async () => {
    vi.mocked(publishChapter).mockResolvedValue(ok(true));
    const body = { title: 'Omun', baseRevision: 0 };
    const response = await PUBLISH(request('/x', json('PUT', body)), context);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(snapshot);
    expect(publishChapter).toHaveBeenCalledWith(ID, body, 'candy-uid');
  });

  it('refuses a body that isn’t JSON', async () => {
    const response = await PUBLISH(
      request('/x', { method: 'PUT', body: 'not json' }),
      context
    );
    expect(response.status).toBe(400);
    expect(publishChapter).not.toHaveBeenCalled();
  });

  it('passes a conflict back as it is, with the newer version', async () => {
    const current = { id: ID, revision: 4 };
    vi.mocked(publishChapter).mockResolvedValue({
      ok: false,
      status: 409,
      body: { error: 'conflict', current }
    });
    const response = await PUBLISH(
      request('/x', json('PUT', { title: 'Omun', baseRevision: 3 })),
      context
    );
    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ error: 'conflict', current });
    expect(revalidateLore).not.toHaveBeenCalled();
  });

  it('makes the lore pages again only when the site changed', async () => {
    vi.mocked(publishChapter).mockResolvedValue(ok(true));
    await PUBLISH(request('/x', json('PUT', { title: 'Omun' })), context);
    expect(revalidateLore).toHaveBeenCalledTimes(1);

    vi.mocked(publishOrder).mockResolvedValue(ok(false));
    await ORDER(request('/x', json('PUT', { ids: [] })));
    expect(publishOrder).toHaveBeenCalledWith({ ids: [] });
    expect(revalidateLore).toHaveBeenCalledTimes(1);

    vi.mocked(unpublishChapter).mockResolvedValue(ok(true));
    await UNPUBLISH(request('/x', { method: 'DELETE' }), context);
    expect(unpublishChapter).toHaveBeenCalledWith(ID);
    expect(revalidateLore).toHaveBeenCalledTimes(2);
  });

  it('says why a chapter can’t be published', async () => {
    vi.mocked(publishChapter).mockResolvedValue({
      ok: false,
      status: 400,
      body: {
        error: 'invalid',
        message: 'Give the chapter its one line before publishing it.'
      }
    });
    const response = await PUBLISH(
      request('/x', json('PUT', { title: 'Omun' })),
      context
    );
    expect(response.status).toBe(400);
    expect((await response.json()).message).toBe(
      'Give the chapter its one line before publishing it.'
    );
  });

  it('answers a database that isn’t there as unavailable, not a crash', async () => {
    const { DatabaseUnavailableError } = await import('@/lib/db/client');
    vi.mocked(loreSnapshot).mockRejectedValue(new DatabaseUnavailableError());
    expect((await GET(request('/api/haven/lore'))).status).toBe(503);
  });
});
