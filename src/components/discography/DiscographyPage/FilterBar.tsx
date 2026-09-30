'use client';

import type { RefObject } from 'react';
import { CloseIcon, MixIcon } from '@/components/icons';
import type { DiscographyCopy } from '@/content/discography/discography';
import { activeFilterCount, type Filters } from '@/lib/discography/catalogue';
import { KIND_LABEL } from '@/lib/discography/format';
import { fill } from '@/lib/text/fill';
import styles from './DiscographyPage.module.scss';
import type { DiscographyView } from './useDiscographyQuery';
import ViewSwitch from './ViewSwitch';

interface FilterBarProps {
  copy: DiscographyCopy['page'];
  filters: Filters;
  view: DiscographyView;
  shown: number;
  total: number;
  trayId: string;
  trayOpen: boolean;
  buttonRef: RefObject<HTMLButtonElement | null>;
  onToggleTray: () => void;
  onFilters: (filters: Filters) => void;
  onView: (view: DiscographyView) => void;
}

// The bar that pins over the page: Filter & sort on the left (with the
// number of filters on), the filters themselves as tags while the tray is
// shut, and the view switch on the right.
export default function FilterBar({
  copy,
  filters,
  view,
  shown,
  total,
  trayId,
  trayOpen,
  buttonRef,
  onToggleTray,
  onFilters,
  onView
}: FilterBarProps) {
  const active = activeFilterCount(filters);
  const tags = [
    ...filters.kinds.map((kind) => ({
      key: kind,
      label: KIND_LABEL[kind].many,
      remove: () =>
        onFilters({
          ...filters,
          kinds: filters.kinds.filter((k) => k !== kind)
        })
    })),
    ...filters.years.map((year) => ({
      key: String(year),
      label: String(year),
      remove: () =>
        onFilters({
          ...filters,
          years: filters.years.filter((y) => y !== year)
        })
    }))
  ];

  return (
    <div className={styles.bar}>
      <div className={styles.barRow}>
        <div className={styles.barStart}>
          <button
            ref={buttonRef}
            type="button"
            className={styles.filterButton}
            data-active={active > 0 || trayOpen}
            aria-expanded={trayOpen}
            aria-controls={trayId}
            onClick={onToggleTray}
          >
            <MixIcon className={styles.filterGlyph} />
            <span>{copy.filters.button}</span>
            {active > 0 && (
              <span className={styles.filterCount}>
                <span className={styles.srOnly}>, on: </span>
                {active}
              </span>
            )}
          </button>
          {!trayOpen && active > 0 && (
            <>
              <ul className={styles.tags}>
                {tags.map((tag) => (
                  <li key={tag.key}>
                    <button
                      type="button"
                      className={styles.tag}
                      onClick={tag.remove}
                      aria-label={fill(copy.filters.remove, {
                        filter: tag.label
                      })}
                    >
                      {tag.label}
                      <CloseIcon className={styles.tagGlyph} />
                    </button>
                  </li>
                ))}
              </ul>
              <p className={styles.shownCount}>
                {fill(copy.filters.count, { shown, total })}
              </p>
            </>
          )}
        </div>
        <ViewSwitch copy={copy.views} value={view} onChange={onView} />
      </div>
    </div>
  );
}
