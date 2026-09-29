import { describe, expect, it } from 'vitest';
import { DETAIL_FIELDS, REQUIRED_FIELDS } from '@/lib/contact/message';
import { siteContact } from '@/content/site/contact';
import contactData from './contact.json';
import { contactPageContent, contactPageSchema } from './contact';

describe('contact page content', () => {
  it('has a label and placeholder for every field of a message', () => {
    for (const field of [...REQUIRED_FIELDS, ...DETAIL_FIELDS])
      expect(contactPageContent.form.fields[field].label).toBeTruthy();
  });

  it('carries the site’s shared email and phone', () => {
    expect(contactPageContent.email).toBe(siteContact.email);
    expect(contactPageContent.phone).toEqual(siteContact.phone);
  });

  it('rejects copy with a missing error message', () => {
    const broken = {
      ...contactData,
      form: {
        ...contactData.form,
        errors: { ...contactData.form.errors, subject: '' }
      }
    };
    expect(contactPageSchema.safeParse(broken).success).toBe(false);
  });
});
