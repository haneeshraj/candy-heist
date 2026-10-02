// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DatabaseUnavailableError } from '@/lib/db/client';
import { withinHourlyLimit } from '@/lib/forms/limits';
import { fileMessage } from '@/lib/inbox/store';
import { sendMessage } from './sendMessage';

vi.mock('@/lib/forms/limits', () => ({ withinHourlyLimit: vi.fn() }));
vi.mock('@/lib/inbox/store', () => ({ fileMessage: vi.fn() }));

const complete = {
  name: ' Alex ',
  email: 'alex@nightfall.events',
  subject: 'A set in July',
  message: 'Three Saturdays on a rooftop.',
  phone: '',
  organisation: '',
  date: '',
  location: '',
  budget: '',
  links: ''
};
const person = () => ({ trap: '', startedAt: Date.now() - 60_000 });

describe('sendMessage', () => {
  beforeEach(() => {
    vi.mocked(withinHourlyLimit).mockReset().mockResolvedValue(true);
    vi.mocked(fileMessage).mockReset().mockResolvedValue('MSG-7KQ2FD');
  });

  it('files a complete message and says who it’s from', async () => {
    await expect(sendMessage(complete, person())).resolves.toEqual({
      ok: true,
      sent: { name: 'Alex', email: 'alex@nightfall.events' }
    });
    expect(fileMessage).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Alex', subject: 'A set in July' })
    );
  });

  it('tells a bot it went through, and keeps nothing', async () => {
    const result = await sendMessage(complete, {
      trap: 'buy now',
      startedAt: 0
    });
    expect(result.ok).toBe(true);
    expect(fileMessage).not.toHaveBeenCalled();
    expect(withinHourlyLimit).not.toHaveBeenCalled();
  });

  it('refuses one the form would have refused', async () => {
    await expect(
      sendMessage({ ...complete, email: 'not an address' }, person())
    ).resolves.toEqual({ ok: false, reason: 'invalid' });
    expect(fileMessage).not.toHaveBeenCalled();
  });

  it('holds back a visitor past the hourly limit', async () => {
    vi.mocked(withinHourlyLimit).mockResolvedValue(false);
    await expect(sendMessage(complete, person())).resolves.toEqual({
      ok: false,
      reason: 'limited'
    });
    expect(fileMessage).not.toHaveBeenCalled();
  });

  it('says so when there’s nowhere to file it', async () => {
    vi.mocked(fileMessage).mockRejectedValue(new DatabaseUnavailableError());
    await expect(sendMessage(complete, person())).resolves.toEqual({
      ok: false,
      reason: 'unavailable'
    });
  });
});
