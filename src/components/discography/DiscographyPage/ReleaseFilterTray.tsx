'use client';

import { FilterTray } from '@/components/common/Filters';
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

interface ReleaseFilterTrayProps {
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

// Figma "Discography — Filter & sort tray": sort one of three; kinds (with
// how many of each) and years any number, none being all.
export default function ReleaseFilterTray({
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
}: ReleaseFilterTrayProps) {
  return (
    <FilterTray
      id={id}
      open={open}
      label={copy.region}
      groups={[
        {
          kind: 'one',
          legend: copy.sort,
          choices: SORTS.map((key) => ({ value: key, label: copy.sorts[key] })),
          value: sort,
          onChange: (value) => onSort(value as SortKey)
        },
        {
          kind: 'many',
          legend: copy.kind,
          choices: KIND_ORDER.filter((kind) => kinds.has(kind)).map((kind) => ({
            value: kind,
            label: `${KIND_LABEL[kind].many} · ${pad(kinds.get(kind) ?? 0)}`
          })),
          values: filters.kinds,
          onChange: (values) =>
            onFilters({ ...filters, kinds: values as ReleaseKind[] })
        },
        {
          kind: 'many',
          legend: copy.year,
          choices: years.map((year) => ({
            value: String(year),
            label: String(year)
          })),
          values: filters.years.map(String),
          onChange: (values) =>
            onFilters({ ...filters, years: values.map(Number) })
        }
      ]}
      count={fill(copy.count, { shown, total })}
      clear={copy.clear}
      canClear={activeFilterCount(filters) > 0}
      onClear={() => onFilters(NO_FILTERS)}
      onClose={onClose}
    />
  );
}
