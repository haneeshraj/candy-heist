'use client';

import { useCallback, useMemo, useSyncExternalStore } from 'react';
import {
  RELEASE_KINDS,
  type ReleaseKind
} from '@/content/discography/releases';
import {
  NO_FILTERS,
  type Filters,
  type SortKey
} from '@/lib/discography/catalogue';

export type DiscographyView = 'vault' | 'monument' | 'index';

export interface DiscographyQuery {
  view: DiscographyView;
  sort: SortKey;
  filters: Filters;
  /** The words searched for; '' for none. */
  search: string;
}

export const DEFAULT_QUERY: DiscographyQuery = {
  view: 'vault',
  sort: 'newest',
  filters: NO_FILTERS,
  search: ''
};

const VIEWS: readonly DiscographyView[] = ['vault', 'monument', 'index'];
const SORTS: readonly SortKey[] = ['newest', 'oldest', 'title'];

const list = (value: string | null) =>
  value ? value.split(',').filter(Boolean) : [];

/** The query in an address's search string; anything unknown is dropped. */
export function parseQuery(search: string): DiscographyQuery {
  const params = new URLSearchParams(search);
  const view = params.get('view') as DiscographyView | null;
  const sort = params.get('sort') as SortKey | null;
  return {
    view: view && VIEWS.includes(view) ? view : DEFAULT_QUERY.view,
    sort: sort && SORTS.includes(sort) ? sort : DEFAULT_QUERY.sort,
    filters: {
      kinds: list(params.get('kind')).filter((k): k is ReleaseKind =>
        (RELEASE_KINDS as readonly string[]).includes(k)
      ),
      years: list(params.get('year'))
        .map(Number)
        .filter((y) => Number.isInteger(y) && y > 1900)
    },
    search: (params.get('q') ?? '').trim().slice(0, 120)
  };
}

/** The search string for a query, leaving out what's at its default. */
export function queryString(query: DiscographyQuery) {
  const params = new URLSearchParams();
  if (query.view !== DEFAULT_QUERY.view) params.set('view', query.view);
  if (query.filters.kinds.length)
    params.set('kind', query.filters.kinds.join(','));
  if (query.filters.years.length)
    params.set('year', query.filters.years.join(','));
  if (query.sort !== DEFAULT_QUERY.sort) params.set('sort', query.sort);
  if (query.search) params.set('q', query.search);
  return params.toString();
}

// The address is the store: the view, the filters, the sort and the
// search live in its query, so a filtered view can be shared or come back
// to. The page is prerendered with the defaults (the server snapshot),
// then reads the address. Changes replace the history entry instead of
// adding to it.
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener('popstate', listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('popstate', listener);
  };
}

const getSnapshot = () => window.location.search;
const getServerSnapshot = () => '';

export function useDiscographyQuery() {
  const search = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  );
  const query = useMemo(() => parseQuery(search), [search]);

  const update = useCallback((next: Partial<DiscographyQuery>) => {
    const merged = { ...parseQuery(window.location.search), ...next };
    const qs = queryString(merged);
    const url = `${window.location.pathname}${qs ? `?${qs}` : ''}${window.location.hash}`;
    window.history.replaceState(window.history.state, '', url);
    listeners.forEach((listener) => listener());
  }, []);

  return { query, update };
}
