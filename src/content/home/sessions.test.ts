import { describe, expect, it } from 'vitest';
import { catalogue } from '@/content/services/catalogue';
import sessionsData from './sessions.json';
import { sessionsContentFor, sessionsCopySchema } from './sessions';

describe('home sessions content', () => {
  it('lists the featured services, in order', () => {
    const content = sessionsContentFor(catalogue);
    expect(content.services.map((service) => service.id)).toEqual(
      sessionsData.featured
    );
    expect(content.services[0]).toEqual({
      id: 'production-session',
      name: 'Production Session',
      summary: 'Fix the track you’re stuck on.',
      icon: 'production'
    });
  });

  it('drops a featured service that’s no longer offered, keeping the rest', () => {
    const offered = catalogue.filter((item) => item.id !== 'dj-lessons');
    const ids = sessionsContentFor(offered).services.map((s) => s.id);
    expect(ids).toEqual(
      sessionsData.featured.filter((id) => id !== 'dj-lessons')
    );
  });

  it('takes a service’s name and line as they are now', () => {
    const renamed = catalogue.map((item) =>
      item.id === 'production-session'
        ? { ...item, name: 'Studio Session', summary: 'One new line.' }
        : item
    );
    expect(sessionsContentFor(renamed).services[0]).toMatchObject({
      id: 'production-session',
      name: 'Studio Session',
      summary: 'One new line.'
    });
  });

  it('rejects section copy with a missing action', () => {
    const broken = { ...sessionsData, cta: undefined };
    expect(sessionsCopySchema.safeParse(broken).success).toBe(false);
  });
});
