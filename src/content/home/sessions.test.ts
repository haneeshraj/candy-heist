import { describe, expect, it } from 'vitest';
import sessionsData from './sessions.json';
import { sessionsContent, sessionsCopySchema } from './sessions';

describe('home sessions content', () => {
  it('lists the featured services from the shared catalogue, in order', () => {
    expect(sessionsContent.services.map((service) => service.id)).toEqual(
      sessionsData.featured
    );
    expect(sessionsContent.services[0]).toEqual({
      id: 'production-session',
      name: 'Production Session',
      summary: 'Fix the track you’re stuck on.',
      icon: 'production'
    });
  });

  it('rejects a featured service the catalogue does not have', () => {
    const broken = { ...sessionsData, featured: ['trumpet-lessons'] };
    expect(sessionsCopySchema.safeParse(broken).success).toBe(false);
  });

  it('rejects section copy with a missing action', () => {
    const broken = { ...sessionsData, cta: undefined };
    expect(sessionsCopySchema.safeParse(broken).success).toBe(false);
  });
});
