import type { ServiceItem, ServiceKind } from '@/content/services/catalogue';
import { blocksText } from '@/lib/markdown/blocks';
import { matchesSearch, searchTerms } from '@/lib/text/search';

// Finding a service in "Book me as a music producer": a search across
// what each item says (its name, line, kind, facts and write-up), a filter
// by kind, and a sort. Featured keeps the client's own order, except that
// while searching, items found by their name, line, kind or facts come
// before those found only in their write-up. An item without a price yet
// sorts after the priced ones either way.

export const SERVICE_SORTS = [
  'featured',
  'name',
  'priceLow',
  'priceHigh'
] as const;

export type ServiceSort = (typeof SERVICE_SORTS)[number];

export interface ServiceBrowse {
  /** The words searched for; '' for none. */
  search: string;
  /** The kinds shown; none is all. */
  kinds: ServiceKind[];
  sort: ServiceSort;
}

export const DEFAULT_BROWSE: ServiceBrowse = {
  search: '',
  kinds: [],
  sort: 'featured'
};

/** How a kind reads, so "1-1" or "commission" finds its items. */
export type KindLabels = Record<ServiceKind, string>;

/** What the item says up front: its name, line, kind and facts. */
const headlineFields = (item: ServiceItem, labels: KindLabels) => [
  item.name,
  item.summary,
  labels[item.kind],
  ...item.facts.flatMap((fact) => [fact.label, fact.value])
];

function byPrice(direction: 1 | -1) {
  return (a: ServiceItem, b: ServiceItem) => {
    if (a.price === undefined) return b.price === undefined ? 0 : 1;
    if (b.price === undefined) return -1;
    return (a.price - b.price) * direction;
  };
}

/** The items the search and filter leave, in the chosen order. */
export function browseItems(
  items: readonly ServiceItem[],
  browse: ServiceBrowse,
  labels: KindLabels
): ServiceItem[] {
  const terms = searchTerms(browse.search);
  const found = new Map<ServiceItem, boolean>();
  for (const item of items) {
    if (browse.kinds.length && !browse.kinds.includes(item.kind)) continue;
    const headline = headlineFields(item, labels);
    if (matchesSearch(headline, terms)) found.set(item, true);
    else if (matchesSearch([...headline, ...blocksText(item.blocks)], terms))
      found.set(item, false);
  }
  const kept = [...found.keys()];
  switch (browse.sort) {
    case 'featured':
      // Stable: the client's order within each.
      return kept.sort((a, b) => Number(found.get(b)) - Number(found.get(a)));
    case 'name':
      return kept.sort((a, b) => a.name.localeCompare(b.name));
    case 'priceLow':
      return kept.sort(byPrice(1));
    case 'priceHigh':
      return kept.sort(byPrice(-1));
  }
}

/** Filters on, for the Filter & sort button's count (the sort isn't one). */
export const browseFilterCount = (browse: ServiceBrowse) => browse.kinds.length;
