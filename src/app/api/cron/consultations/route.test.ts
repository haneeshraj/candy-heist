// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';
import { sweepConsultations } from '@/lib/consult/store';
import { GET } from './route';

// The daily sweep, as Vercel Cron calls it: only with the secret, and then
// the whole sweep, abandoned uploads included.

vi.mock('@/lib/consult/store', () => ({ sweepConsultations: vi.fn() }));

const call = (authorization?: string) =>
  GET(
    new Request('https://candy-heist.test/api/cron/consultations', {
      headers: authorization ? { authorization } : {}
    })
  );

describe('the daily consultation sweep', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  it('does nothing until it has a secret', async () => {
    vi.stubEnv('CRON_SECRET', '');
    expect((await call('Bearer anything')).status).toBe(503);
    expect(sweepConsultations).not.toHaveBeenCalled();
  });

  it('turns away a call without the secret', async () => {
    vi.stubEnv('CRON_SECRET', 'right-secret');
    expect((await call()).status).toBe(401);
    expect((await call('Bearer wrong-secret')).status).toBe(401);
    expect(sweepConsultations).not.toHaveBeenCalled();
  });

  it('sweeps everything when Vercel calls it', async () => {
    vi.stubEnv('CRON_SECRET', 'right-secret');
    vi.mocked(sweepConsultations).mockResolvedValue({ deleted: 2, orphans: 1 });
    const response = await call('Bearer right-secret');
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ deleted: 2, orphans: 1 });
    expect(sweepConsultations).toHaveBeenCalledWith(expect.any(Date), {
      orphans: true
    });
  });
});
