import { PauseIcon, PlayIcon } from '@/components/icons';
import { fill } from '@/lib/text/fill';
import styles from './TestimonialsSection.module.scss';
import type { QuoteDotsProps } from './TestimonialsSection.types';

// Figma "IV v2 · By service": dots and dashes under the quote. The quote
// showing is a dash that fills toward the next one, the rest are diamonds
// after the sigil; any of them shows its quote. The dash's fill is the
// rotation's clock (a CSS animation, paused whenever the rotation is), so
// the next quote comes in exactly as it fills. A small toggle pauses the
// rotation for good, for whoever wants to read at their own pace.
export default function QuoteDots({
  count,
  active,
  running,
  paused,
  rotates,
  labels,
  onSelect,
  onElapsed,
  onTogglePause
}: QuoteDotsProps) {
  return (
    <div className={styles.controls} data-motion="controls">
      <ul className={styles.dots}>
        {Array.from({ length: count }, (_, i) => {
          const on = i === active;
          return (
            <li key={i}>
              <button
                type="button"
                className={styles.dot}
                aria-label={fill(labels.show, { n: i + 1, total: count })}
                aria-current={on || undefined}
                onClick={() => onSelect(i)}
              >
                {on ? (
                  <span className={styles.dash} aria-hidden="true">
                    <span
                      className={styles.dashFill}
                      data-running={(rotates && running) || undefined}
                      data-still={!rotates || undefined}
                      onAnimationEnd={onElapsed}
                    />
                  </span>
                ) : (
                  <span className={styles.diamond} aria-hidden="true" />
                )}
              </button>
            </li>
          );
        })}
      </ul>
      {rotates && (
        <button
          type="button"
          className={styles.toggle}
          aria-label={paused ? labels.play : labels.pause}
          onClick={onTogglePause}
        >
          {paused ? (
            <PlayIcon className={styles.toggleGlyph} />
          ) : (
            <PauseIcon className={styles.toggleGlyph} />
          )}
        </button>
      )}
    </div>
  );
}
