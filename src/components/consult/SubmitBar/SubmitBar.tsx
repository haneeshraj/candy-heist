'use client';

import { fill } from '@/lib/text/fill';
import styles from './SubmitBar.module.scss';
import type { SubmitBarProps } from './SubmitBar.types';

// The send, held at the foot of the screen while the producer works: what
// he's about to send, in words, and the button. It says why when there's
// nothing to send yet, rather than sitting there disabled.
export default function SubmitBar({
  copy,
  noteCount,
  toolCount,
  sending,
  onSend
}: SubmitBarProps) {
  const count = (n: number, words: { one: string; other: string }) =>
    n === 1 ? words.one : fill(words.other, { count: n });
  const empty = noteCount === 0 && toolCount === 0;

  return (
    <div className={styles.bar}>
      <p className={styles.summary} aria-live="polite">
        {empty
          ? copy.nothing
          : fill(copy.summary, {
              notes: count(noteCount, copy.notes),
              tools: count(toolCount, copy.tools)
            })}
      </p>
      <button
        type="button"
        className={styles.send}
        disabled={empty || sending}
        aria-busy={sending || undefined}
        onClick={onSend}
      >
        {sending ? copy.sending : copy.send}
      </button>
    </div>
  );
}
