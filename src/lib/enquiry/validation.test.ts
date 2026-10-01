import { describe, expect, it } from 'vitest';
import { emptyEnquiry, MAX_LENGTH, type DjEnquiry } from './enquiry';
import { IncompleteEnquiryError, sendEnquiry } from './sendEnquiry';
import { validateEnquiry, type EnquiryErrorCopy } from './validation';

const copy: EnquiryErrorCopy = {
  name: 'name',
  email: 'email',
  emailInvalid: 'emailInvalid',
  phone: 'phone',
  budget: 'budget',
  about: 'about',
  tooLong: 'under {max}'
};

const complete = (over: Partial<DjEnquiry> = {}): DjEnquiry => ({
  ...emptyEnquiry(),
  name: 'Alex Martin',
  email: 'alex@nightfall.events',
  budget: '$1,500',
  about: 'A rooftop night in July, around 300 people.',
  ...over
});

describe('validateEnquiry', () => {
  it('asks for the name, email, budget and event, and nothing else', () => {
    expect(validateEnquiry(emptyEnquiry(), copy)).toEqual({
      name: 'name',
      email: 'email',
      budget: 'budget',
      about: 'about'
    });
  });

  it('lets a complete enquiry through with the rest left blank', () => {
    expect(validateEnquiry(complete(), copy)).toEqual({});
  });

  it('checks the email address and the phone number', () => {
    expect(
      validateEnquiry(
        complete({ email: 'alex@nightfall', phone: 'call me' }),
        copy
      )
    ).toEqual({ email: 'emailInvalid', phone: 'phone' });
  });

  it('names the limit when a field runs long', () => {
    const long = 'x'.repeat(MAX_LENGTH.eventName + 1);
    expect(validateEnquiry(complete({ eventName: long }), copy)).toEqual({
      eventName: `under ${MAX_LENGTH.eventName}`
    });
  });
});

describe('sendEnquiry', () => {
  it('hands back the enquiry, trimmed', async () => {
    const sent = await sendEnquiry(complete({ name: '  Alex Martin ' }));
    expect(sent.name).toBe('Alex Martin');
  });

  it('refuses one without what is needed', async () => {
    await expect(sendEnquiry(emptyEnquiry())).rejects.toBeInstanceOf(
      IncompleteEnquiryError
    );
  });
});
