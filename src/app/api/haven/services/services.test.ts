// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { verifyHavenToken } from '@/lib/haven/auth';
import { revalidateServices } from '@/lib/services/revalidate';
import { publishServices, servicesSnapshot } from '@/lib/services/store';
import {
  InvalidPhotoError,
  storeServicePhotos
} from '@/lib/storage/servicePhotos';
import { PUT as PHOTO } from './photo/route';
import { GET, PUT } from './route';

// The services routes as Candy Haven meets them, with the store, storage
// and Google's keys stood in for: who gets in, what each passes on, and
// that the site's pages are made again only when the services changed.

vi.mock('@/lib/haven/auth', async (actual) => ({
  ...(await actual<typeof import('@/lib/haven/auth')>()),
  getGoogleKeys: vi.fn(),
  verifyHavenToken: vi.fn()
}));
vi.mock('@/lib/forms/limits', () => ({
  withinHourlyLimit: vi.fn().mockResolvedValue(true)
}));
vi.mock('@/lib/services/revalidate', () => ({ revalidateServices: vi.fn() }));
vi.mock('@/lib/services/store', () => ({
  servicesSnapshot: vi.fn(),
  publishServices: vi.fn()
}));
vi.mock('@/lib/storage/servicePhotos', async (actual) => ({
  ...(await actual<typeof import('@/lib/storage/servicePhotos')>()),
  storeServicePhotos: vi.fn()
}));

const snapshot = {
  live: true,
  revision: 3,
  publishedAt: '2026-10-09T12:00:00.000Z',
  publishedBy: 'candy-uid',
  items: [],
  hours: {}
};

const request = (init?: RequestInit) =>
  new Request('https://candy-heist.test/api/haven/services', {
    ...init,
    headers: { authorization: 'Bearer a.b.c', ...init?.headers }
  });
const json = (body: unknown) =>
  request({
    method: 'PUT',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' }
  });
const image = (type: string, body = 'image bytes') =>
  request({ method: 'PUT', body, headers: { 'content-type': type } });

describe('the services API', () => {
  beforeEach(() => {
    vi.stubEnv('FIREBASE_PROJECT_ID', 'candy-haven-test');
    vi.stubEnv('HAVEN_ALLOWED_UIDS', 'candy-uid');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://project.supabase.test');
    vi.stubEnv('SUPABASE_SECRET_KEY', 'sb_secret_x');
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
    expect((await GET(request())).status).toBe(401);
    expect((await PUT(json({ items: [] }))).status).toBe(401);
    expect((await PHOTO(image('image/png'))).status).toBe(401);
    expect(servicesSnapshot).not.toHaveBeenCalled();
    expect(publishServices).not.toHaveBeenCalled();
    expect(storeServicePhotos).not.toHaveBeenCalled();
  });

  it('hands over what the site offers, uncached', async () => {
    vi.mocked(servicesSnapshot).mockResolvedValue(snapshot as never);
    const response = await GET(request());
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(await response.json()).toEqual(snapshot);
    expect(revalidateServices).not.toHaveBeenCalled();
  });

  it('passes a publish on with who sent it, and makes the pages again', async () => {
    vi.mocked(publishServices).mockResolvedValue({
      ok: true,
      body: snapshot as never,
      siteChanged: true
    });
    const body = { items: [], baseRevision: 2 };
    const response = await PUT(json(body));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(snapshot);
    expect(publishServices).toHaveBeenCalledWith(body, 'candy-uid');
    expect(revalidateServices).toHaveBeenCalledTimes(1);
  });

  it('passes a conflict back as it is, and changes nothing', async () => {
    vi.mocked(publishServices).mockResolvedValue({
      ok: false,
      status: 409,
      body: { error: 'conflict', current: snapshot }
    });
    const response = await PUT(json({ baseRevision: 1 }));
    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({
      error: 'conflict',
      current: snapshot
    });
    expect(revalidateServices).not.toHaveBeenCalled();
  });

  it('refuses a body that isn’t JSON', async () => {
    const response = await PUT(request({ method: 'PUT', body: 'not json' }));
    expect(response.status).toBe(400);
    expect(publishServices).not.toHaveBeenCalled();
  });

  it('answers a database that isn’t there as unavailable, not a crash', async () => {
    const { DatabaseUnavailableError } = await import('@/lib/db/client');
    vi.mocked(servicesSnapshot).mockRejectedValue(
      new DatabaseUnavailableError()
    );
    expect((await GET(request())).status).toBe(503);
  });

  describe('a photo', () => {
    it('is cut and stored, and its two addresses handed back', async () => {
      const stored = {
        card: 'https://x/card.webp',
        wide: 'https://x/wide.webp'
      };
      vi.mocked(storeServicePhotos).mockResolvedValue(stored);
      const response = await PHOTO(image('image/jpeg'));
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual(stored);
      expect(vi.mocked(storeServicePhotos).mock.calls[0][0]).toEqual(
        Buffer.from('image bytes')
      );
      // Storing a photo changes nothing on the pages until a publish.
      expect(revalidateServices).not.toHaveBeenCalled();
    });

    it('says why one can’t be used', async () => {
      vi.mocked(storeServicePhotos).mockRejectedValue(
        new InvalidPhotoError('Too small.')
      );
      const response = await PHOTO(image('image/png'));
      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({
        error: 'invalid',
        message: 'Too small.'
      });
    });

    it('refuses what isn’t an image type it takes', async () => {
      expect((await PHOTO(image('image/gif'))).status).toBe(415);
      expect(storeServicePhotos).not.toHaveBeenCalled();
    });

    it('says when there’s nowhere to keep it', async () => {
      vi.stubEnv('SUPABASE_SECRET_KEY', '');
      const response = await PHOTO(image('image/png'));
      expect(response.status).toBe(503);
      expect((await response.json()).error).toBe('storage_unconfigured');
    });
  });
});
