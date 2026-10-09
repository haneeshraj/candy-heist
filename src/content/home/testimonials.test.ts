import { describe, expect, it } from 'vitest';
import { catalogue } from '@/content/services/catalogue';
import testimonialsData from './testimonials.json';
import { testimonialsContentFor, testimonialsCopySchema } from './testimonials';

describe('home testimonials content', () => {
  it('ties every quote to the service it’s about, and books a session', () => {
    const content = testimonialsContentFor(catalogue);
    for (const { service } of content.testimonials) {
      expect(service?.name).toBeTruthy();
      expect(service?.icon).toBeTruthy();
    }
    expect(content.cta.href).toBe('/services/producer');
  });

  it('keeps a quote whose service is no longer offered, without the service', () => {
    const gone = testimonialsData.testimonials[0].service;
    const content = testimonialsContentFor(
      catalogue.filter((item) => item.id !== gone)
    );
    expect(content.testimonials).toHaveLength(
      testimonialsData.testimonials.length
    );
    expect(content.testimonials[0]).toMatchObject({
      quote: testimonialsData.testimonials[0].quote,
      service: null
    });
  });

  it('rejects a quote without its words', () => {
    const broken = {
      ...testimonialsData,
      testimonials: [{ ...testimonialsData.testimonials[0], quote: '' }]
    };
    expect(testimonialsCopySchema.safeParse(broken).success).toBe(false);
  });
});
