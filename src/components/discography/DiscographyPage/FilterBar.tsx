'use client';

import type { RefObject } from 'react';
import { FilterButton, FilterTags } from '@/components/common/Filters';
import { SearchToggle } from '@/components/common/SearchToggle';
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
  search: string;
  view: DiscographyView;
  shown: number;
  total: number;
  trayId: string;
  trayOpen: boolean;
  buttonRef: RefObject<HTMLButtonElement | null>;
  onToggleTray: () => void;
  onFilters: (filters: Filters) => void;
  onSearch: (search: string) => void;
  onView: (view: DiscographyView) => void;
}

// The bar that pins over the page: Filter & sort and the search on the
// left (the filters on, as tags, while the tray is shut), and the view
// switch on the right.
export default function FilterBar({
  copy,
  filters,
  search,
  view,
  shown,
  total,
  trayId,
  trayOpen,
  buttonRef,
  onToggleTray,
  onFilters,
  onSearch,
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
          <FilterButton
            label={copy.filters.button}
            count={active}
            open={trayOpen}
            controls={trayId}
            buttonRef={buttonRef}
            onClick={onToggleTray}
          />
          <SearchToggle
            className={styles.barSearch}
            copy={copy.search}
            value={search}
            onSearch={onSearch}
          />
          {!trayOpen && (active > 0 || search) ? (
            <FilterTags
              tags={tags}
              remove={copy.filters.remove}
              count={fill(copy.filters.count, { shown, total })}
            />
          ) : null}
        </div>
        <ViewSwitch copy={copy.views} value={view} onChange={onView} />
      </div>
    </div>
  );
}
