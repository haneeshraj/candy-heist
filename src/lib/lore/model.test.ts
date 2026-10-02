import { describe, expect, it } from 'vitest';
import { presetFor } from '@/lib/planets/engine';
import {
  isChapterId,
  isPlanetId,
  orderSchema,
  publishInputSchema
} from './model';

const chapter = {
  slug: 'omun',
  title: ' Omun ',
  line: 'A resonance.',
  body: 'It rises.',
  planet: { id: 'preset:omun', name: 'Omun', spec: presetFor('omun').spec },
  baseRevision: 0
};

describe('what Haven sends', () => {
  it('knows a chapter id and a planet id when it sees one', () => {
    expect(isChapterId('6650f0f0f0f0f0f0f0f0f0f0')).toBe(true);
    expect(isChapterId('omun')).toBe(false);
    expect(isPlanetId('preset:omun')).toBe(true);
    expect(isPlanetId('6650f0f0f0f0f0f0f0f0f0f0')).toBe(true);
    expect(isPlanetId('omun')).toBe(false);
  });

  it('takes a whole chapter to publish, trimmed', () => {
    const parsed = publishInputSchema.parse(chapter);
    expect(parsed).toMatchObject({ title: 'Omun', force: false });
    expect(parsed.planet.spec.layers.length).toBeGreaterThan(0);
  });

  it('refuses a chapter that isn’t finished', () => {
    const refused = (patch: object) =>
      publishInputSchema.safeParse({ ...chapter, ...patch }).success === false;
    expect(refused({ title: '' })).toBe(true);
    expect(refused({ line: '  ' })).toBe(true);
    expect(refused({ slug: 'Not A Slug' })).toBe(true);
    expect(refused({ baseRevision: -1 })).toBe(true);
    expect(refused({ planet: { ...chapter.planet, id: 'nope' } })).toBe(true);
    expect(
      refused({
        planet: {
          ...chapter.planet,
          spec: { layers: [{ id: 'a', type: 'sun' }] }
        }
      })
    ).toBe(true);
  });

  it('takes an order as a list of chapter ids', () => {
    expect(
      orderSchema.safeParse({ ids: ['6650f0f0f0f0f0f0f0f0f0f0'] }).success
    ).toBe(true);
    expect(orderSchema.safeParse({ ids: ['omun'] }).success).toBe(false);
  });
});
