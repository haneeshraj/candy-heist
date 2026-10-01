import { describe, expect, it } from 'vitest';
import { catalogue, type ServiceItem } from '@/content/services/catalogue';
import { browseItems, DEFAULT_BROWSE, type ServiceBrowse } from './browse';

const LABELS = { commission: 'Commission', session: '1-1 session' };
const ids = (items: ServiceItem[]) => items.map((item) => item.id);
const browse = (patch: Partial<ServiceBrowse>, items = catalogue) =>
  ids(browseItems(items, { ...DEFAULT_BROWSE, ...patch }, LABELS));

describe('browseItems', () => {
  it('keeps the client’s order by default', () => {
    expect(browse({})).toEqual(ids(catalogue));
  });

  it('filters by kind', () => {
    expect(browse({ kinds: ['session'] })).toEqual([
      'production-session',
      'dj-lessons'
    ]);
  });

  it('searches names, kinds and write-ups, names first', () => {
    // Mixing only mentions mastering in its write-up.
    expect(browse({ search: 'mastering' })).toEqual([
      'mastering',
      'mixing-and-mastering',
      'mixing'
    ]);
    expect(browse({ search: '1-1' })).toEqual([
      'production-session',
      'dj-lessons'
    ]);
    // "beatmatch" is only in the DJ lessons' write-up.
    expect(browse({ search: 'beatmatch' })).toEqual(['dj-lessons']);
    expect(browse({ search: 'trumpet' })).toEqual([]);
  });

  it('sorts by name, and by price with the unpriced last', () => {
    expect(browse({ sort: 'name' })[0]).toBe('beat-production');
    const priced = catalogue.map((item, i) =>
      i === 1 ? { ...item, price: 80 } : i === 4 ? { ...item, price: 40 } : item
    );
    expect(browse({ sort: 'priceLow' }, priced).slice(0, 2)).toEqual([
      'production-session',
      'mastering'
    ]);
    expect(browse({ sort: 'priceHigh' }, priced).slice(0, 2)).toEqual([
      'mastering',
      'production-session'
    ]);
  });
});
