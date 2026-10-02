// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { withinHourlyLimit } from '@/lib/forms/limits';
import { fileEnquiry } from '@/lib/inbox/store';
import { sendEnquiry } from './sendEnquiry';

vi.mock('@/lib/forms/limits', () => ({ withinHourlyLimit: vi.fn() }));
vi.mock('@/lib/inbox/store', () => ({ fileEnquiry: vi.fn() }));

const complete = {
  name: '  Alex Martin ',
  title: 'Booking agent',
  email: 'alex@nightfall.events',
  phone: '',
  eventName: 'Rooftop Series',
  eventVenue: '',
  budget: '$1,500',
  about: 'Three Saturdays in July.'
};
const person = () => ({ trap: '', startedAt: Date.now() - 60_000 });

describe('sendEnquiry', () => {
  beforeEach(() => {
    vi.mocked(withinHourlyLimit).mockReset().mockResolvedValue(true);
    vi.mocked(fileEnquiry).mockReset().mockResolvedValue('DJ-H3XN8P');
  });

  it('files a complete enquiry and hands it back, tidied', async () => {
    const result = await sendEnquiry(complete, person());
    expect(result).toMatchObject({ ok: true, sent: { name: 'Alex Martin' } });
    expect(fileEnquiry).toHaveBeenCalledOnce();
  });

  it('tells a bot it went through, and keeps nothing', async () => {
    const result = await sendEnquiry(complete, undefined);
    expect(result.ok).toBe(true);
    expect(fileEnquiry).not.toHaveBeenCalled();
  });

  it('refuses one without its budget', async () => {
    await expect(
      sendEnquiry({ ...complete, budget: ' ' }, person())
    ).resolves.toEqual({ ok: false, reason: 'invalid' });
  });

  it('holds back a visitor past the hourly limit', async () => {
    vi.mocked(withinHourlyLimit).mockResolvedValue(false);
    await expect(sendEnquiry(complete, person())).resolves.toEqual({
      ok: false,
      reason: 'limited'
    });
    expect(fileEnquiry).not.toHaveBeenCalled();
  });
});
