// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { verifyHavenToken } from '@/lib/haven/auth';
import { revalidateReleases } from '@/lib/releases/revalidate';
import {
  publishEverything,
  publishRelease,
  releasesSnapshot,
  removeRelease,
  setShelf,
  setVisibility,
  updateRelease,
  type ReleasesOutcome
} from '@/lib/releases/store';
import { GET, POST } from './route';
import { POST as EVERYTHING } from './all/route';
import { DELETE as REMOVE, PATCH as UPDATE } from './[id]/route';
import { PUT as VISIBILITY } from './[id]/visibility/route';
import { PUT as SHELF } from './shelf/route';

// The releases routes as Candy Haven meets them, with the store and
// Google's keys stood in for: who gets in, what each passes on, and that
// the discography is made again only when the site changed.

vi.mock('@/lib/haven/auth', async (actual) => ({
  ...(await actual<typeof import('@/lib/haven/auth')>()),
  getGoogleKeys: vi.fn(),
  verifyHavenToken: vi.fn()
}));
vi.mock('@/lib/forms/limits', () => ({
  withinHourlyLimit: vi.fn().mockResolvedValue(true)
}));
vi.mock('@/lib/releases/revalidate', () => ({ revalidateReleases: vi.fn() }));
vi.mock('@/lib/releases/store', () => ({
  releasesSnapshot: vi.fn(),
  publishEverything: vi.fn(),
  publishRelease: vi.fn(),
  updateRelease: vi.fn(),
  removeRelease: vi.fn(),
  setVisibility: vi.fn(),
  setShelf: vi.fn()
}));

const ID = '6650f0f0f0f0f0f0f0f0f0f0';
const context = { params: Promise.resolve({ id: ID }) };
const snapshot = { live: true, releases: [], shelf: [] };
const ok = (siteChanged = true): ReleasesOutcome => ({
  ok: true,
  snapshot,
  siteChanged
});

const request = (init?: RequestInit) =>
  new Request('https://candy-heist.test/api/haven/releases', {
    ...init,
    headers: { authorization: 'Bearer a.b.c', ...init?.headers }
  });
const json = (method: string, body: unknown) => ({
  method,
  body: JSON.stringify(body),
  headers: { 'content-type': 'application/json' }
});

describe('the releases API', () => {
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
    expect((await GET(request())).status).toBe(401);
    expect((await EVERYTHING(request(json('POST', {})))).status).toBe(401);
    expect(
      (await UPDATE(request(json('PATCH', { title: 'A' })), context)).status
    ).toBe(401);
    expect(releasesSnapshot).not.toHaveBeenCalled();
    expect(publishEverything).not.toHaveBeenCalled();
    expect(updateRelease).not.toHaveBeenCalled();
  });

  it('hands over what’s on the site, uncached', async () => {
    vi.mocked(releasesSnapshot).mockResolvedValue(snapshot);
    const response = await GET(request());
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(await response.json()).toEqual(snapshot);
  });

  it('passes each write on with who sent it, and makes the pages again', async () => {
    vi.mocked(publishEverything).mockResolvedValue({
      ok: true,
      snapshot: { ...snapshot, ids: { a: ID } },
      siteChanged: true
    });
    const everything = { releases: [{ ref: 'a', fields: {} }] };
    const response = await EVERYTHING(request(json('POST', everything)));
    expect(await response.json()).toEqual({ ...snapshot, ids: { a: ID } });
    expect(publishEverything).toHaveBeenCalledWith(everything, 'candy-uid');

    vi.mocked(publishRelease).mockResolvedValue({
      ok: true,
      snapshot: { ...snapshot, ids: { b: ID } },
      siteChanged: true
    });
    await POST(request(json('POST', { ref: 'b', fields: {} })));
    expect(publishRelease).toHaveBeenCalledWith(
      { ref: 'b', fields: {} },
      'candy-uid'
    );

    vi.mocked(updateRelease).mockResolvedValue(ok());
    await UPDATE(request(json('PATCH', { label: 'Self-released' })), context);
    expect(updateRelease).toHaveBeenCalledWith(
      ID,
      { label: 'Self-released' },
      'candy-uid'
    );

    vi.mocked(setVisibility).mockResolvedValue(ok());
    await VISIBILITY(request(json('PUT', { shown: false })), context);
    expect(setVisibility).toHaveBeenCalledWith(
      ID,
      { shown: false },
      'candy-uid'
    );

    vi.mocked(setShelf).mockResolvedValue(ok());
    await SHELF(request(json('PUT', { ids: [ID] })));
    expect(setShelf).toHaveBeenCalledWith({ ids: [ID] });

    vi.mocked(removeRelease).mockResolvedValue(ok());
    await REMOVE(request({ method: 'DELETE' }), context);
    expect(removeRelease).toHaveBeenCalledWith(ID);

    expect(revalidateReleases).toHaveBeenCalledTimes(6);
  });

  it('makes nothing again when the site didn’t change', async () => {
    vi.mocked(removeRelease).mockResolvedValue(ok(false));
    await REMOVE(request({ method: 'DELETE' }), context);
    expect(revalidateReleases).not.toHaveBeenCalled();
  });

  it('says why a release can’t go on the site', async () => {
    vi.mocked(updateRelease).mockResolvedValue({
      ok: false,
      status: 400,
      body: { error: 'invalid', message: 'A single holds exactly one track.' }
    });
    const response = await UPDATE(
      request(json('PATCH', { kind: 'single' })),
      context
    );
    expect(response.status).toBe(400);
    expect((await response.json()).message).toBe(
      'A single holds exactly one track.'
    );
    expect(revalidateReleases).not.toHaveBeenCalled();
  });

  it('refuses a body that isn’t JSON', async () => {
    const response = await UPDATE(
      request({ method: 'PATCH', body: 'not json' }),
      context
    );
    expect(response.status).toBe(400);
    expect(updateRelease).not.toHaveBeenCalled();
  });

  it('answers a database that isn’t there as unavailable, not a crash', async () => {
    const { DatabaseUnavailableError } = await import('@/lib/db/client');
    vi.mocked(releasesSnapshot).mockRejectedValue(
      new DatabaseUnavailableError()
    );
    expect((await GET(request())).status).toBe(503);
  });
});
