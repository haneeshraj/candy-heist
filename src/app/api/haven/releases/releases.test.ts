// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { verifyHavenToken } from '@/lib/haven/auth';
import { revalidateReleases } from '@/lib/releases/revalidate';
import {
  applyChanges,
  clearCover,
  publishEverything,
  publishRelease,
  releasesSnapshot,
  removeRelease,
  setCover,
  setShelf,
  setVisibility,
  updateRelease,
  type ReleasesOutcome
} from '@/lib/releases/store';
import { coversConfigured } from '@/lib/storage/covers';
import { GET, POST } from './route';
import { POST as EVERYTHING } from './all/route';
import { POST as CHANGES } from './changes/route';
import { DELETE as REMOVE, PATCH as UPDATE } from './[id]/route';
import { DELETE as UNCOVER, PUT as COVER } from './[id]/cover/route';
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
  setShelf: vi.fn(),
  applyChanges: vi.fn(),
  setCover: vi.fn(),
  clearCover: vi.fn()
}));
vi.mock('@/lib/storage/covers', () => ({ coversConfigured: vi.fn() }));

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
const image = (
  body: Uint8Array<ArrayBuffer>,
  type = 'image/png',
  headers: Record<string, string> = {}
) => ({ method: 'PUT', body, headers: { 'content-type': type, ...headers } });
const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 1, 2, 3]);
const EIGHT_MB = 8 * 1024 * 1024;

describe('the releases API', () => {
  beforeEach(() => {
    vi.stubEnv('FIREBASE_PROJECT_ID', 'candy-haven-test');
    vi.stubEnv('HAVEN_ALLOWED_UIDS', 'candy-uid');
    vi.mocked(verifyHavenToken).mockResolvedValue({
      ok: true,
      uid: 'candy-uid'
    });
    vi.mocked(coversConfigured).mockReturnValue(true);
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
    expect((await CHANGES(request(json('POST', { shelf: [] })))).status).toBe(
      401
    );
    expect(releasesSnapshot).not.toHaveBeenCalled();
    expect(publishEverything).not.toHaveBeenCalled();
    expect(updateRelease).not.toHaveBeenCalled();
    expect(applyChanges).not.toHaveBeenCalled();
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

  it('passes several changes on in one request, and makes the pages once', async () => {
    vi.mocked(applyChanges).mockResolvedValue({
      ok: true,
      snapshot: { ...snapshot, shelf: [ID], ids: { c: ID } },
      siteChanged: true
    });
    const changes = {
      add: [{ ref: 'c', fields: {} }],
      update: [{ id: ID, fields: { label: 'Self-released' } }],
      visibility: [{ id: ID, shown: false }],
      shelf: [ID]
    };
    const response = await CHANGES(request(json('POST', changes)));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      ...snapshot,
      shelf: [ID],
      ids: { c: ID }
    });
    expect(applyChanges).toHaveBeenCalledWith(changes, 'candy-uid');
    expect(revalidateReleases).toHaveBeenCalledTimes(1);
  });

  it('says why several changes can’t be made, and makes nothing again', async () => {
    vi.mocked(applyChanges).mockResolvedValue({
      ok: false,
      status: 409,
      body: { error: 'out_of_date', ids: [ID] }
    });
    const response = await CHANGES(
      request(json('POST', { visibility: [{ id: ID, shown: false }] }))
    );
    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ error: 'out_of_date', ids: [ID] });
    expect(revalidateReleases).not.toHaveBeenCalled();
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

    const changes = await CHANGES(request({ method: 'POST', body: '{' }));
    expect(changes.status).toBe(400);
    expect(await changes.json()).toEqual({ error: 'bad_body' });
    expect(applyChanges).not.toHaveBeenCalled();
  });

  it('lets nobody change a cover without one of the two sign-ins', async () => {
    vi.mocked(verifyHavenToken).mockResolvedValue({ ok: false, status: 401 });
    expect((await COVER(request(image(PNG)), context)).status).toBe(401);
    expect((await UNCOVER(request({ method: 'DELETE' }), context)).status).toBe(
      401
    );
    expect(setCover).not.toHaveBeenCalled();
    expect(clearCover).not.toHaveBeenCalled();
  });

  it('passes a cover’s bytes on with who sent it, and makes the pages once', async () => {
    vi.mocked(setCover).mockResolvedValue(ok());
    const response = await COVER(request(image(PNG)), context);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(snapshot);
    const [id, bytes, uid] = vi.mocked(setCover).mock.calls[0];
    expect([id, uid]).toEqual([ID, 'candy-uid']);
    expect(Buffer.isBuffer(bytes)).toBe(true);
    expect([...bytes]).toEqual([...PNG]);
    expect(revalidateReleases).toHaveBeenCalledTimes(1);

    // A JPEG or a WebP too, whatever else its type says.
    await COVER(request(image(PNG, 'image/jpeg')), context);
    await COVER(request(image(PNG, 'image/webp; q=1')), context);
    expect(setCover).toHaveBeenCalledTimes(3);
  });

  it('takes a cover off, back to the placeholder', async () => {
    vi.mocked(clearCover).mockResolvedValue(ok());
    const response = await UNCOVER(request({ method: 'DELETE' }), context);
    expect(response.status).toBe(200);
    expect(clearCover).toHaveBeenCalledWith(ID, 'candy-uid');
    expect(revalidateReleases).toHaveBeenCalledTimes(1);
  });

  it('refuses a cover that isn’t a PNG, JPEG or WebP', async () => {
    for (const type of ['image/gif', 'application/json', '']) {
      const response = await COVER(request(image(PNG, type)), context);
      expect(response.status).toBe(415);
      expect(await response.json()).toEqual({ error: 'unsupported_type' });
    }
    expect(setCover).not.toHaveBeenCalled();
  });

  it('refuses a cover over 8 MB, by its length or by counting', async () => {
    const said = await COVER(
      request(image(PNG, 'image/png', { 'content-length': `${EIGHT_MB + 1}` })),
      context
    );
    expect(said.status).toBe(413);
    expect(await said.json()).toEqual({ error: 'too_large' });

    const counted = await COVER(
      request(image(new Uint8Array(EIGHT_MB + 1))),
      context
    );
    expect(counted.status).toBe(413);
    expect(setCover).not.toHaveBeenCalled();

    vi.mocked(setCover).mockResolvedValue(ok());
    const exactly = await COVER(
      request(image(new Uint8Array(EIGHT_MB))),
      context
    );
    expect(exactly.status).toBe(200);
  });

  it('says when there’s no cover storage set up, before reading the image', async () => {
    vi.mocked(coversConfigured).mockReturnValue(false);
    const sent = request(image(PNG));
    const response = await COVER(sent, context);
    expect(sent.bodyUsed).toBe(false);
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({
      error: 'storage_unconfigured',
      message: 'The website has no cover storage set up yet.'
    });
    expect(setCover).not.toHaveBeenCalled();
  });

  it('says why an image can’t be a cover, and makes nothing again', async () => {
    vi.mocked(setCover).mockResolvedValue({
      ok: false,
      status: 400,
      body: { error: 'invalid', message: 'That file isn’t an image.' }
    });
    const response = await COVER(request(image(PNG)), context);
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: 'invalid',
      message: 'That file isn’t an image.'
    });
    expect(revalidateReleases).not.toHaveBeenCalled();
  });

  it('answers a database that isn’t there as unavailable, not a crash', async () => {
    const { DatabaseUnavailableError } = await import('@/lib/db/client');
    vi.mocked(releasesSnapshot).mockRejectedValue(
      new DatabaseUnavailableError()
    );
    expect((await GET(request())).status).toBe(503);
  });
});
