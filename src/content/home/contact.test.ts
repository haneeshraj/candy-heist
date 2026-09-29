import { describe, expect, it } from 'vitest';
import { footerContent } from '@/content/site/footer';
import contactData from './contact.json';
import { contactContent, contactCopySchema } from './contact';

describe('home contact content', () => {
  it('reaches out through the same address as the footer', () => {
    expect(contactContent.email).toBe(footerContent.email);
    expect(contactContent.phone.href).toMatch(/^tel:\+\d+$/);
  });

  it('rejects section copy with a missing action', () => {
    const broken = { ...contactData, cta: undefined };
    expect(contactCopySchema.safeParse(broken).success).toBe(false);
  });
});
