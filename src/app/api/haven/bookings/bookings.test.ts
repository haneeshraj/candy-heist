// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  bookingChangesSince,
  cancelBooking,
  moveBooking
} from '@/lib/booking/server/haven';
import { verifyHavenToken } from '@/lib/haven/auth';
import { POST as CANCEL } from './[ref]/cancel/route';
import { POST as MOVE } from './[ref]/move/route';
import { GET } from './route';

// The bookings routes as Candy Haven meets them, with the bookings and
// Google's keys stood in for: who gets in and what each passes on.

vi.mock('@/lib/haven/auth', async (actual) => ({
  ...(await actual<typeof import('@/lib/haven/auth')>()),
  getGoogleKeys: vi.fn(),
  verifyHavenToken: vi.fn()
}));
vi.mock('@/lib/forms/limits', () => ({
  withinHourlyLimit: vi.fn().mockResolvedValue(true)
}));
vi.mock('@/lib/booking/server/haven', () => ({
  bookingChangesSince: vi.fn(),
  moveBooking: vi.fn(),
  cancelBooking: vi.fn()
}));

const REF = 'CH-K3P2Q8';
const context = (ref = REF) => ({ params: Promise.resolve({ ref }) });
const request = (url: string, init?: RequestInit) =>
  new Request(`https://candy-heist.test${url}`, {
    ...init,
    headers: { authorization: 'Bearer a.b.c', ...init?.headers }
  });
const post = (body: unknown) =>
  request('/x', {
    method: 'POST',
    body: typeof body === 'string' ? body : JSON.stringify(body),
    headers: { 'content-type': 'application/json' }
  });
const result = { booking: { ref: REF }, calendar: 'updated', email: 'sent' };

describe('the bookings API', () => {
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
    expect((await GET(request('/api/haven/bookings'))).status).toBe(401);
    expect((await MOVE(post({ start: 'x' }), context())).status).toBe(401);
    expect((await CANCEL(post({}), context())).status).toBe(401);
    expect(bookingChangesSince).not.toHaveBeenCalled();
    expect(moveBooking).not.toHaveBeenCalled();
    expect(cancelBooking).not.toHaveBeenCalled();
  });

  it('hands over what changed since the cursor, uncached', async () => {
    const changes = {
      bookings: [],
      cursor: '2027-01-01T00:00:00.000Z',
      more: false
    };
    vi.mocked(bookingChangesSince).mockResolvedValue(changes);
    const response = await GET(
      request('/api/haven/bookings?since=2027-01-01T00:00:00.000Z')
    );
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(await response.json()).toEqual(changes);
    expect(bookingChangesSince).toHaveBeenCalledWith(
      new Date('2027-01-01T00:00:00.000Z')
    );
    expect(
      (await GET(request('/api/haven/bookings?since=yesterday'))).status
    ).toBe(400);
  });

  it('passes a move and a cancel on with who made them', async () => {
    vi.mocked(moveBooking).mockResolvedValue({
      ok: true,
      body: result as never
    });
    const moved = await MOVE(
      post({ start: '2027-03-04T18:00:00Z' }),
      context()
    );
    expect(moved.status).toBe(200);
    expect(await moved.json()).toEqual(result);
    expect(moveBooking).toHaveBeenCalledWith(
      REF,
      { start: '2027-03-04T18:00:00Z' },
      'candy-uid'
    );

    vi.mocked(cancelBooking).mockResolvedValue({
      ok: false,
      status: 409,
      body: { error: 'cancelled' }
    });
    const cancelled = await CANCEL(post({ note: 'Ill.' }), context());
    expect(cancelled.status).toBe(409);
    expect(cancelBooking).toHaveBeenCalledWith(
      REF,
      { note: 'Ill.' },
      'candy-uid'
    );
  });

  it('refuses a reference that isn’t a booking’s, and a body that isn’t JSON', async () => {
    expect((await MOVE(post({}), context('MSG-K3P2Q8'))).status).toBe(404);
    expect((await CANCEL(post('not json'), context())).status).toBe(400);
    expect(moveBooking).not.toHaveBeenCalled();
    expect(cancelBooking).not.toHaveBeenCalled();
  });
});
