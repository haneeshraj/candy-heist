import { describe, expect, it } from 'vitest';
import { services } from '@/content/sessions/services';
import sessionsData from './sessions.json';
import { sessionsContent, sessionsCopySchema } from './sessions';

describe('home sessions content', () => {
  it('lists every service from the shared catalogue, in order', () => {
    expect(sessionsContent.services.map((service) => service.id)).toEqual(
      services.map((service) => service.id)
    );
    expect(sessionsContent.services[0]).toEqual({
      id: 'production-session',
      name: 'Production Session',
      summary: 'Bring the track you’re stuck on and fix it together.',
      icon: 'production'
    });
  });

  it('rejects section copy with a missing action', () => {
    const broken = { ...sessionsData, cta: undefined };
    expect(sessionsCopySchema.safeParse(broken).success).toBe(false);
  });
});
