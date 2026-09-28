import { describe, expect, it } from 'vitest';
import sessionsData from './sessions.json';
import { sessionsContent, sessionsContentSchema } from './sessions';

describe('sessions content', () => {
  it('parses the JSON into the section content', () => {
    expect(sessionsContent.services.map((service) => service.id)).toEqual([
      'production-session',
      'dj-lessons',
      'project-feedback',
      'mix-and-master'
    ]);
  });

  it('rejects a service with an unknown glyph', () => {
    const broken = {
      ...sessionsData,
      services: [{ ...sessionsData.services[0], icon: 'trumpet' }]
    };
    expect(sessionsContentSchema.safeParse(broken).success).toBe(false);
  });

  it('rejects an empty service list', () => {
    expect(
      sessionsContentSchema.safeParse({ ...sessionsData, services: [] }).success
    ).toBe(false);
  });
});
