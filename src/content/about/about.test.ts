import { describe, expect, it } from 'vitest';
import aboutData from './about.json';
import { aboutContent, aboutSchema } from './about';

describe('about page content', () => {
  it('finds a link for every streaming platform it lists', () => {
    expect(aboutContent.streaming.map((social) => social.platform)).toEqual(
      aboutContent.who.streaming
    );
  });

  it('gives every role a photo', () => {
    for (const role of aboutContent.behind.roles)
      expect(role.photo.src).toBeTruthy();
  });

  it('rejects a missing readout', () => {
    const broken = {
      ...aboutData,
      nayara: { ...aboutData.nayara, readouts: [aboutData.nayara.readouts[0]] }
    };
    expect(aboutSchema.safeParse(broken).success).toBe(false);
  });
});
