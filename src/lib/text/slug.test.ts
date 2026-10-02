import { describe, expect, it } from 'vitest';
import { slugify, uniqueSlug } from './slug';

describe('slugify', () => {
  it('joins lowercase words with dashes', () => {
    expect(slugify('Move Yo Body! (Extended Mix)')).toBe(
      'move-yo-body-extended-mix'
    );
  });

  it('drops accents and reads an ampersand as "and"', () => {
    expect(slugify('Café & Crème')).toBe('cafe-and-creme');
  });

  it('keeps digits and trims the edges', () => {
    expect(slugify('  4x4 ')).toBe('4x4');
    expect(slugify("Devil's Advocate")).toBe('devil-s-advocate');
  });

  it('is empty for a title with no letters or digits', () => {
    expect(slugify('!!!')).toBe('');
  });

  it('stops at 60 characters, never on a dash', () => {
    const slug = slugify('word '.repeat(40));
    expect(slug.length).toBeLessThanOrEqual(60);
    expect(slug.endsWith('-')).toBe(false);
  });
});

describe('uniqueSlug', () => {
  it('uses the title when nothing has it', () => {
    expect(uniqueSlug('Menace', new Set())).toBe('menace');
  });

  it('counts on from 2 when it is taken', () => {
    expect(uniqueSlug('Menace', new Set(['menace', 'menace-2']))).toBe(
      'menace-3'
    );
  });

  it('falls back for a title with no letters', () => {
    expect(uniqueSlug('???', new Set(), 'release')).toBe('release');
  });
});
