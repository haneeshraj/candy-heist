import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import servicesData from './services.json';
import { findService, serviceSchema, services } from './services';

describe('services catalogue', () => {
  it('parses every service with a unique id', () => {
    const ids = services.map((service) => service.id);
    expect(ids).toEqual([
      'production-session',
      'dj-lessons',
      'project-feedback',
      'mix-and-master'
    ]);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('finds a service by id, and nothing for an unknown one', () => {
    expect(findService('dj-lessons')?.name).toBe('DJ Lessons');
    expect(findService('trumpet')).toBeUndefined();
    expect(findService(null)).toBeUndefined();
  });

  it('rejects a service with an unknown glyph', () => {
    const broken = { ...servicesData[0], icon: 'trumpet' };
    expect(serviceSchema.safeParse(broken).success).toBe(false);
  });

  it('rejects an empty catalogue', () => {
    expect(z.array(serviceSchema).min(1).safeParse([]).success).toBe(false);
  });
});
