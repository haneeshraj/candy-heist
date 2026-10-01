import { describe, expect, it } from 'vitest';
import { matchesSearch, normalizeText, searchTerms } from './search';

describe('normalizeText', () => {
  it('drops case, accents and punctuation', () => {
    expect(normalizeText('  Café & Crème, Vol. 2! ')).toBe('cafe creme vol 2');
  });
});

describe('searchTerms', () => {
  it('splits a query into its words, and a blank one into none', () => {
    expect(searchTerms('Mix  MASTER')).toEqual(['mix', 'master']);
    expect(searchTerms('  ')).toEqual([]);
  });
});

describe('matchesSearch', () => {
  const fields = ['Mixing & Mastering', 'Both, start to finish', undefined];

  it('needs every word, each at the start of a word', () => {
    expect(matchesSearch(fields, searchTerms('mix master'))).toBe(true);
    expect(matchesSearch(fields, searchTerms('mastering finish'))).toBe(true);
    expect(matchesSearch(fields, searchTerms('mix beat'))).toBe(false);
    // Inside a word doesn't count: "ix" isn't a word start.
    expect(matchesSearch(fields, searchTerms('ix'))).toBe(false);
  });

  it('matches everything with no words to look for', () => {
    expect(matchesSearch(fields, [])).toBe(true);
  });
});
