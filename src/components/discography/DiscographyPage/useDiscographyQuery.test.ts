import { describe, expect, it } from 'vitest';
import { DEFAULT_QUERY, parseQuery, queryString } from './useDiscographyQuery';

describe('the discography query', () => {
  it('reads the view, filters, sort and search from the address', () => {
    expect(
      parseQuery('?view=index&kind=ep,single&year=2024&sort=oldest&q=+halls+')
    ).toEqual({
      view: 'index',
      sort: 'oldest',
      filters: { kinds: ['ep', 'single'], years: [2024] },
      search: 'halls'
    });
  });

  it('falls back to the defaults, dropping what it does not know', () => {
    expect(parseQuery('')).toEqual(DEFAULT_QUERY);
    expect(
      parseQuery('?view=grid&kind=mixtape,ep&year=soon&sort=best')
    ).toEqual({
      ...DEFAULT_QUERY,
      filters: { kinds: ['ep'], years: [] }
    });
  });

  it('writes only what differs from the defaults', () => {
    expect(queryString(DEFAULT_QUERY)).toBe('');
    expect(
      queryString({
        ...DEFAULT_QUERY,
        view: 'monument',
        filters: { kinds: ['album'], years: [] },
        search: 'the halls'
      })
    ).toBe('view=monument&kind=album&q=the+halls');
  });
});
