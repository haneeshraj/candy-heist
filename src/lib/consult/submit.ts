'use server';

import { DatabaseUnavailableError } from '@/lib/db/client';
import { withinHourlyLimit } from '@/lib/forms/limits';
import { looksAutomated } from '@/lib/forms/spam';
import { parseFeedback } from './engine';
import { FEEDBACK_PER_HOUR } from './model';
import { fileFeedback, findRoom } from './store';

// Where a producer's feedback goes from a link's page: checked again here,
// since this runs on the server for anyone who calls it, against the
// link's own track (still open, and long enough for every note), then
// filed for Candy Haven to pick up. Nobody but Candy and the developer
// ever reads it; nothing here hands any back.

export type SubmitFeedbackResult =
  | { ok: true }
  | { ok: false; reason: 'invalid' | 'closed' | 'limited' | 'unavailable' };

export async function submitFeedback(
  token: unknown,
  raw: unknown,
  check: unknown
): Promise<SubmitFeedbackResult> {
  if (typeof token !== 'string') return { ok: false, reason: 'closed' };

  // A bot is told it went through, and nothing is kept.
  if (looksAutomated(check)) return { ok: true };

  try {
    const room = await findRoom(token);
    if (!room) return { ok: false, reason: 'closed' };
    const feedback = parseFeedback(raw, room.durationMs / 1000);
    if (!feedback) return { ok: false, reason: 'invalid' };
    if (!(await withinHourlyLimit('consult', FEEDBACK_PER_HOUR)))
      return { ok: false, reason: 'limited' };
    return (await fileFeedback(token, feedback))
      ? { ok: true }
      : { ok: false, reason: 'closed' };
  } catch (error) {
    if (!(error instanceof DatabaseUnavailableError))
      console.error('Feedback could not be filed.', error);
    return { ok: false, reason: 'unavailable' };
  }
}
