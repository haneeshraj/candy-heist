import { CloseIcon } from '@/components/icons';
import { fill } from '@/lib/text/fill';
import styles from './Filters.module.scss';
import type { FilterTagsProps } from './Filters.types';

// The filters on, while the tray is shut: × takes one off. Then how many
// are left of how many.
export default function FilterTags({ tags, remove, count }: FilterTagsProps) {
  return (
    <>
      <ul className={styles.tags}>
        {tags.map((tag) => (
          <li key={tag.key}>
            <button
              type="button"
              className={styles.tag}
              onClick={tag.remove}
              aria-label={fill(remove, { filter: tag.label })}
            >
              {tag.label}
              <CloseIcon className={styles.tagGlyph} />
            </button>
          </li>
        ))}
      </ul>
      {count ? <p className={styles.shownCount}>{count}</p> : null}
    </>
  );
}
