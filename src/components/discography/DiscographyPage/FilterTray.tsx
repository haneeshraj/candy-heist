'use client';

import { useId } from 'react';
import { SigilChip } from '@/components/common/SigilChip';
import type { DiscographyCopy } from '@/content/discography/discography';
import type { ReleaseKind } from '@/content/discography/releases';
import {
  activeFilterCount,
  NO_FILTERS,
  type Filters,
  type SortKey
} from '@/lib/discography/catalogue';
import { KIND_LABEL, KIND_ORDER } from '@/lib/discography/format';
import { fill } from '@/lib/text/fill';
import styles from './DiscographyPage.module.scss';

interface FilterTrayProps {
  id: string;
  open: boolean;
  copy: DiscographyCopy['page']['filters'];
  filters: Filters;
  sort: SortKey;
  kinds: Map<ReleaseKind, number>;
  years: number[];
  shown: number;
  total: number;
  onFilters: (filters: Filters) => void;
  onSort: (sort: SortKey) => void;
  onClose: () => void;
}

const SORTS: SortKey[] = ['newest', 'oldest', 'title'];
const pad = (n: number) => String(n).padStart(2, '0');
const toggle = <T,>(list: T[], item: T) =>
  list.includes(item) ? list.filter((x) => x !== item) : [...list, item];

// Figma "Discography — Filter & sort tray": opened from the bar, it drops
// in under it and pushes the releases down; every choice applies as it's
// made, so the releases change under the reader's hand. Sort is one of
// three; kinds and years are any number (none is all). Escape shuts it.
export default function FilterTray({
  id,
  open,
  copy,
  filters,
  sort,
  kinds,
  years,
  shown,
  total,
  onFilters,
  onSort,
  onClose
}: FilterTrayProps) {
  const sortName = useId();
  const active = activeFilterCount(filters);

  return (
    <div
      id={id}
      className={styles.tray}
      data-open={open}
      inert={!open}
      onKeyDown={(event) => {
        if (event.key === 'Escape') onClose();
      }}
    >
      <div className={styles.trayClip}>
        <div className={styles.trayPanel} role="group" aria-label={copy.region}>
          <fieldset className={styles.group}>
            <legend className={styles.groupLabel}>{copy.sort}</legend>
            <div className={styles.radios}>
              {SORTS.map((key) => (
                <label
                  key={key}
                  className={styles.radio}
                  data-on={key === sort}
                >
                  <input
                    className={styles.srOnly}
                    type="radio"
                    name={sortName}
                    value={key}
                    checked={key === sort}
                    onChange={() => onSort(key)}
                  />
                  <span className={styles.radioDot} aria-hidden="true" />
                  {copy.sorts[key]}
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className={styles.group}>
            <legend className={styles.groupLabel}>{copy.kind}</legend>
            <div className={styles.chips}>
              {KIND_ORDER.filter((kind) => kinds.has(kind)).map((kind) => (
                <label
                  key={kind}
                  className={styles.chip}
                  data-on={filters.kinds.includes(kind)}
                >
                  <input
                    className={styles.srOnly}
                    type="checkbox"
                    checked={filters.kinds.includes(kind)}
                    onChange={() =>
                      onFilters({
                        ...filters,
                        kinds: toggle(filters.kinds, kind)
                      })
                    }
                  />
                  {KIND_LABEL[kind].many} · {pad(kinds.get(kind) ?? 0)}
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className={styles.group}>
            <legend className={styles.groupLabel}>{copy.year}</legend>
            <div className={styles.chips}>
              {years.map((year) => (
                <label
                  key={year}
                  className={styles.chip}
                  data-on={filters.years.includes(year)}
                >
                  <input
                    className={styles.srOnly}
                    type="checkbox"
                    checked={filters.years.includes(year)}
                    onChange={() =>
                      onFilters({
                        ...filters,
                        years: toggle(filters.years, year)
                      })
                    }
                  />
                  {year}
                </label>
              ))}
            </div>
          </fieldset>

          <div className={styles.trayFoot}>
            <p className={styles.trayCount} aria-live="polite">
              {fill(copy.count, { shown, total })}
            </p>
            <SigilChip
              variant="ghost"
              size="sm"
              icon={null}
              disabled={active === 0}
              onClick={() => onFilters(NO_FILTERS)}
            >
              {copy.clear}
            </SigilChip>
          </div>
        </div>
      </div>
    </div>
  );
}
