import { describe, expect, it } from 'vitest';
import {
  chapterInputSchema,
  isPlanetId,
  orderSchema,
  planetInputSchema,
  slugify
} from './model';

describe('slugify', () => {
  it('makes an address from a title', () => {
    expect(slugify('The Great Disconnection')).toBe('the-great-disconnection');
    expect(slugify('  Omun!  ')).toBe('omun');
    expect(slugify('Nayarasam: one line')).toBe('nayarasam-one-line');
    expect(slugify('Café Noir')).toBe('cafe-noir');
  });

  it('never makes an empty one or a long one', () => {
    expect(slugify('***')).toBe('chapter');
    const long = slugify('word '.repeat(40));
    expect(long.length).toBeLessThanOrEqual(60);
    expect(long.endsWith('-')).toBe(false);
  });
});

describe('what Haven sends', () => {
  it('knows a planet id when it sees one', () => {
    expect(isPlanetId('preset:omun')).toBe(true);
    expect(isPlanetId('6650f0f0f0f0f0f0f0f0f0f0')).toBe(true);
    expect(isPlanetId('omun')).toBe(false);
  });

  it('fills a new chapter in, and needs only its title', () => {
    expect(chapterInputSchema.parse({ title: ' Omun ' })).toEqual({
      title: 'Omun',
      line: '',
      planetId: 'preset:network',
      body: ''
    });
    expect(chapterInputSchema.safeParse({ title: '' }).success).toBe(false);
    expect(
      chapterInputSchema.safeParse({ title: 'A', slug: 'Not A Slug' }).success
    ).toBe(false);
    expect(
      chapterInputSchema.safeParse({ title: 'A', planetId: 'nope' }).success
    ).toBe(false);
  });

  it('checks a planet before keeping it', () => {
    expect(
      planetInputSchema.safeParse({ name: 'Ember', spec: {} }).success
    ).toBe(true);
    expect(
      planetInputSchema.safeParse({
        name: 'Ember',
        spec: { layers: [{ id: 'a', type: 'sun' }] }
      }).success
    ).toBe(false);
  });

  it('takes an order as a list of chapter ids', () => {
    expect(
      orderSchema.safeParse({ ids: ['6650f0f0f0f0f0f0f0f0f0f0'] }).success
    ).toBe(true);
    expect(orderSchema.safeParse({ ids: ['omun'] }).success).toBe(false);
  });
});
