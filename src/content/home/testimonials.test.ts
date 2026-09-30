import { describe, expect, it } from 'vitest';
import testimonialsData from './testimonials.json';
import { testimonialsContent, testimonialsCopySchema } from './testimonials';

describe('home testimonials content', () => {
  it('ties every quote to a service in the catalogue, and books at /sessions', () => {
    for (const { service } of testimonialsContent.testimonials) {
      expect(service.name).toBeTruthy();
      expect(service.icon).toBeTruthy();
    }
    expect(testimonialsContent.cta.href).toBe('/sessions');
  });

  it('rejects a quote about a service the catalogue does not have', () => {
    const broken = {
      ...testimonialsData,
      testimonials: [
        { ...testimonialsData.testimonials[0], service: 'beat-battles' }
      ]
    };
    expect(testimonialsCopySchema.safeParse(broken).success).toBe(false);
  });
});
