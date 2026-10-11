// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DatabaseUnavailableError } from '@/lib/db/client';
import { withinHourlyLimit } from '@/lib/forms/limits';
import { emptyChain, newBand } from './engine';
import type { Room } from './model';
import { fileFeedback, findRoom } from './store';
import { submitFeedback } from './submit';

// The page's send, with the database stood in for: what it refuses, what
// it files, and that a bot is never told it was caught.

vi.mock('@/lib/forms/limits', () => ({ withinHourlyLimit: vi.fn() }));
vi.mock('./store', () => ({ findRoom: vi.fn(), fileFeedback: vi.fn() }));

const token = 'a'.repeat(43);
const room: Room = {
  token,
  title: 'Menace',
  message: '',
  durationMs: 200_000,
  bpm: 124,
  audioUrl:
    'https://store1.public.blob.vercel-storage.com/consultation-dev/a.wav',
  waveform: 'AAAA',
  expiresAt: '2026-10-17T00:00:00.000Z'
};
const feedback = {
  name: 'Nasko',
  notes: [{ id: 'n1', at: 83, end: null, text: 'More high end', chain: null }],
  chain: { ...emptyChain(), eq: [{ ...newBand('b1', 'bell', 1500), gain: 4 }] }
};
/** What a person's form sends alongside: nothing in the trap, opened a while ago. */
const human = () => ({ trap: '', startedAt: Date.now() - 60_000 });

describe('sending feedback from a link’s page', () => {
  beforeEach(() => {
    vi.mocked(findRoom).mockResolvedValue(room);
    vi.mocked(fileFeedback).mockResolvedValue(true);
    vi.mocked(withinHourlyLimit).mockResolvedValue(true);
  });

  afterEach(() => vi.clearAllMocks());

  it('files feedback that fits its track', async () => {
    expect(await submitFeedback(token, feedback, human())).toEqual({
      ok: true
    });
    expect(fileFeedback).toHaveBeenCalledWith(token, feedback);
  });

  it('tells a bot it went through, and keeps nothing', async () => {
    const bot = {
      trap: 'https://spam.example',
      startedAt: Date.now() - 60_000
    };
    expect(await submitFeedback(token, feedback, bot)).toEqual({ ok: true });
    expect(
      await submitFeedback(token, feedback, { trap: '', startedAt: Date.now() })
    ).toEqual({
      ok: true
    });
    expect(fileFeedback).not.toHaveBeenCalled();
  });

  it('refuses a link that has closed', async () => {
    vi.mocked(findRoom).mockResolvedValue(null);
    expect(await submitFeedback(token, feedback, human())).toEqual({
      ok: false,
      reason: 'closed'
    });
    expect(await submitFeedback(42, feedback, human())).toEqual({
      ok: false,
      reason: 'closed'
    });
    expect(fileFeedback).not.toHaveBeenCalled();
  });

  it('refuses feedback that doesn’t fit, a note past the end included', async () => {
    const late = { ...feedback, notes: [{ ...feedback.notes[0], at: 260 }] };
    expect(await submitFeedback(token, late, human())).toEqual({
      ok: false,
      reason: 'invalid'
    });
    expect(await submitFeedback(token, { name: '' }, human())).toEqual({
      ok: false,
      reason: 'invalid'
    });
    expect(fileFeedback).not.toHaveBeenCalled();
  });

  it('holds a visitor to the hourly limit', async () => {
    vi.mocked(withinHourlyLimit).mockResolvedValue(false);
    expect(await submitFeedback(token, feedback, human())).toEqual({
      ok: false,
      reason: 'limited'
    });
    expect(withinHourlyLimit).toHaveBeenCalledWith('consult', 10);
    expect(fileFeedback).not.toHaveBeenCalled();
  });

  it('says so when the link closed between opening and filing', async () => {
    vi.mocked(fileFeedback).mockResolvedValue(false);
    expect(await submitFeedback(token, feedback, human())).toEqual({
      ok: false,
      reason: 'closed'
    });
  });

  it('answers a missing database as unavailable, not as a crash', async () => {
    vi.mocked(findRoom).mockRejectedValue(new DatabaseUnavailableError());
    expect(await submitFeedback(token, feedback, human())).toEqual({
      ok: false,
      reason: 'unavailable'
    });
  });
});
