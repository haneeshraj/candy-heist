import { MixIcon } from '@/components/icons';
import styles from './Filters.module.scss';
import type { FilterButtonProps } from './Filters.types';

// "Filter & sort": opens the tray under the bar, and counts the filters on.
export default function FilterButton({
  label,
  count,
  open,
  controls,
  buttonRef,
  onClick
}: FilterButtonProps) {
  return (
    <button
      ref={buttonRef}
      type="button"
      className={styles.filterButton}
      data-active={count > 0 || open}
      aria-expanded={open}
      aria-controls={controls}
      onClick={onClick}
    >
      <MixIcon className={styles.filterGlyph} />
      <span>{label}</span>
      {count > 0 && (
        <span className={styles.filterCount}>
          <span className={styles.srOnly}>, on: </span>
          {count}
        </span>
      )}
    </button>
  );
}
