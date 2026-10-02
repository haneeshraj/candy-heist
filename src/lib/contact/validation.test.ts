import { describe, expect, it } from 'vitest';
import { emptyMessage, MAX_LENGTH, type ContactMessage } from './message';
import { validateMessage, type MessageErrorCopy } from './validation';

const copy: MessageErrorCopy = {
  name: 'name',
  email: 'email',
  emailInvalid: 'emailInvalid',
  subject: 'subject',
  message: 'message',
  phone: 'phone',
  tooLong: 'under {max}'
};

const complete = (over: Partial<ContactMessage> = {}): ContactMessage => ({
  ...emptyMessage(),
  name: 'Alex Martin',
  email: 'alex@nightfall.events',
  subject: 'A set in November',
  message: 'We run a night in Halifax and would love to have you.',
  ...over
});

describe('validateMessage', () => {
  it('asks for the four required fields and nothing else', () => {
    expect(validateMessage(emptyMessage(), copy)).toEqual({
      name: 'name',
      email: 'email',
      subject: 'subject',
      message: 'message'
    });
  });

  it('lets a complete message through with every detail left blank', () => {
    expect(validateMessage(complete(), copy)).toEqual({});
  });

  it('checks the email address and the phone number', () => {
    expect(
      validateMessage(
        complete({ email: 'alex@nightfall', phone: 'call me' }),
        copy
      )
    ).toEqual({ email: 'emailInvalid', phone: 'phone' });
    expect(
      validateMessage(complete({ phone: '+1 (902) 555-0142' }), copy)
    ).toEqual({});
  });

  it('names the limit when a field runs long', () => {
    const long = 'x'.repeat(MAX_LENGTH.subject + 1);
    expect(validateMessage(complete({ subject: long }), copy)).toEqual({
      subject: `under ${MAX_LENGTH.subject}`
    });
  });

  it('ignores the spaces around a value', () => {
    expect(validateMessage(complete({ name: '   ' }), copy)).toEqual({
      name: 'name'
    });
  });
});
