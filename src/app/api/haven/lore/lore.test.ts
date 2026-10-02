// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { verifyHavenToken } from '@/lib/haven/auth';
import { revalidateLore } from '@/lib/lore/revalidate';
import {
  createChapter,
  deleteChapter,
  loreSnapshot,
  publishChapter,
  publishOrder,
  saveChapter,
  savePlanet,
  type LoreOutcome
} from '@/lib/lore/store';
import { GET } from './route';
import { POST as CREATE } from './chapters/route';
import { DELETE as DELETE_CHAPTER, PUT as SAVE } from './chapters/[id]/route';
import { POST as PUBLISH } from './chapters/[id]/publish/route';
import { POST as PUBLISH_ORDER } from './order/publish/route';
import { PUT as SAVE_PLANET } from './planets/[id]/route';

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
  createChapter: vi.fn(),
  saveChapter: vi.fn(),
  deleteChapter: vi.fn(),
  publishChapter: vi.fn(),
  unpublishChapter: vi.fn(),
  reorderChapters: vi.fn(),
  publishOrder: vi.fn(),
  createPlanet: vi.fn(),
  savePlanet: vi.fn(),
  deletePlanet: vi.fn()
}));

const ID = '6650f0f0f0f0f0f0f0f0f0f0';
const context = { params: Promise.resolve({ id: ID }) };
const snapshot = { live: false, chapters: [], planets: [] };
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
      (await CREATE(request('/x', json('POST', { title: 'A' })))).status
    ).toBe(401);
    expect(
      (await DELETE_CHAPTER(request('/x', { method: 'DELETE' }), context))
        .status
    ).toBe(401);
    expect(loreSnapshot).not.toHaveBeenCalled();
    expect(createChapter).not.toHaveBeenCalled();
    expect(deleteChapter).not.toHaveBeenCalled();
  });

  it('hands over the whole lore, uncached', async () => {
    vi.mocked(loreSnapshot).mockResolvedValue(snapshot);
    const response = await GET(request('/api/haven/lore'));
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(await response.json()).toEqual(snapshot);
  });

  it('passes a new chapter on with who wrote it, and answers with the lore', async () => {
    vi.mocked(createChapter).mockResolvedValue(ok());
    const response = await CREATE(
      request('/x', json('POST', { title: 'Omun' }))
    );
    expect(response.status).toBe(200);
    expect(createChapter).toHaveBeenCalledWith({ title: 'Omun' }, 'candy-uid');
    expect(revalidateLore).not.toHaveBeenCalled();
  });

  it('refuses a body that isn’t JSON', async () => {
    const response = await SAVE(
      request('/x', { method: 'PUT', body: 'not json' }),
      context
    );
    expect(response.status).toBe(400);
    expect(saveChapter).not.toHaveBeenCalled();
  });

  it('passes a conflict back as it is, with the newer version', async () => {
    const current = { id: ID, revision: 4 };
    vi.mocked(saveChapter).mockResolvedValue({
      ok: false,
      status: 409,
      body: { error: 'conflict', current }
    });
    const response = await SAVE(
      request('/x', json('PUT', { title: 'Omun', baseRevision: 3 })),
      context
    );
    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ error: 'conflict', current });
    expect(saveChapter).toHaveBeenCalledWith(
      ID,
      { title: 'Omun', baseRevision: 3 },
      'candy-uid'
    );
  });

  it('makes the lore pages again only when the site changed', async () => {
    vi.mocked(publishChapter).mockResolvedValue(ok(true));
    expect(
      (await PUBLISH(request('/x', json('POST', { revision: 2 })), context))
        .status
    ).toBe(200);
    expect(publishChapter).toHaveBeenCalledWith(
      ID,
      { revision: 2 },
      'candy-uid'
    );
    expect(revalidateLore).toHaveBeenCalledTimes(1);

    vi.mocked(publishOrder).mockResolvedValue(ok(false));
    await PUBLISH_ORDER(request('/x', { method: 'POST' }));
    expect(revalidateLore).toHaveBeenCalledTimes(1);

    vi.mocked(deleteChapter).mockResolvedValue(ok(true));
    await DELETE_CHAPTER(request('/x', { method: 'DELETE' }), context);
    expect(revalidateLore).toHaveBeenCalledTimes(2);
  });

  it('says why a planet in use can’t go', async () => {
    vi.mocked(savePlanet).mockResolvedValue({
      ok: false,
      status: 400,
      body: { error: 'invalid', message: 'A planet needs a name' }
    });
    const response = await SAVE_PLANET(
      request('/x', json('PUT', { name: '' })),
      context
    );
    expect(response.status).toBe(400);
    expect((await response.json()).message).toBe('A planet needs a name');
  });

  it('answers a database that isn’t there as unavailable, not a crash', async () => {
    const { DatabaseUnavailableError } = await import('@/lib/db/client');
    vi.mocked(loreSnapshot).mockRejectedValue(new DatabaseUnavailableError());
    expect((await GET(request('/api/haven/lore'))).status).toBe(503);
  });
});
