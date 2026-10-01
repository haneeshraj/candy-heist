'use client';

import { useId, useRef, useState } from 'react';
import {
  FilterButton,
  FilterTags,
  FilterTray
} from '@/components/common/Filters';
import { SearchToggle } from '@/components/common/SearchToggle';
import { SERVICE_KINDS, type ServiceKind } from '@/content/services/catalogue';
import { fill } from '@/lib/booking/format';
import {
  browseFilterCount,
  DEFAULT_BROWSE,
  SERVICE_SORTS,
  type ServiceSort
} from '@/lib/services/browse';
import styles from './IntroStep.module.scss';
import type { BrowseBarProps } from './IntroStep.types';

const pad = (n: number) => String(n).padStart(2, '0');

// Over the services: Filter & sort, which opens the tray (sort, and the
// kinds to show), and the search, which waits for its button. While the
// tray is shut, the filters on show as tags with how many are left.
export default function BrowseBar({
  copy,
  kinds,
  items,
  browse,
  shown,
  onBrowse
}: BrowseBarProps) {
  const trayId = useId();
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const [open, setOpen] = useState(false);
  const { filters } = copy;
  const active = browseFilterCount(browse);
  const count = fill(filters.count, { shown, total: items.length });
  const present = SERVICE_KINDS.filter((kind) =>
    items.some((item) => item.kind === kind)
  );

  const update = (patch: Partial<typeof browse>) =>
    onBrowse({ ...browse, ...patch });

  return (
    <div className={styles.browse}>
      <div className={styles.browseRow} data-reveal>
        <FilterButton
          label={filters.button}
          count={active}
          open={open}
          controls={trayId}
          buttonRef={buttonRef}
          onClick={() => setOpen((was) => !was)}
        />
        <SearchToggle
          copy={copy.search}
          value={browse.search}
          onSearch={(search) => update({ search })}
        />
        {!open && (active > 0 || browse.search) ? (
          <FilterTags
            tags={browse.kinds.map((kind) => ({
              key: kind,
              label: kinds[kind].group,
              remove: () =>
                update({ kinds: browse.kinds.filter((k) => k !== kind) })
            }))}
            remove={filters.remove}
            count={count}
          />
        ) : null}
      </div>

      <FilterTray
        id={trayId}
        open={open}
        label={filters.region}
        groups={[
          {
            kind: 'one',
            legend: filters.sort,
            choices: SERVICE_SORTS.map((sort) => ({
              value: sort,
              label: filters.sorts[sort]
            })),
            value: browse.sort,
            onChange: (sort) => update({ sort: sort as ServiceSort })
          },
          {
            kind: 'many',
            legend: filters.kind,
            choices: present.map((kind) => ({
              value: kind,
              label: `${kinds[kind].group} · ${pad(
                items.filter((item) => item.kind === kind).length
              )}`
            })),
            values: browse.kinds,
            onChange: (values) => update({ kinds: values as ServiceKind[] })
          }
        ]}
        count={count}
        clear={filters.clear}
        canClear={active > 0 || browse.search !== ''}
        onClear={() => onBrowse({ ...DEFAULT_BROWSE, sort: browse.sort })}
        onClose={() => {
          setOpen(false);
          buttonRef.current?.focus();
        }}
      />
    </div>
  );
}
