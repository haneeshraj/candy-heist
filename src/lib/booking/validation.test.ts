import { describe, expect, it } from 'vitest';
import { validateDetails } from './validation';

const messages = {
  name: 'name',
  email: 'email',
  emailInvalid: 'emailInvalid',
  phone: 'phone',
  note: 'note'
};

const details = {
  name: 'Alex Martin',
  email: 'alex@example.com',
  phone: '',
  note: ''
};

describe('validateDetails', () => {
  it('accepts a name and an email on their own', () => {
    expect(validateDetails(details, messages)).toEqual({});
  });

  it('needs a name and a usable email', () => {
    expect(
      validateDetails({ ...details, name: '  ', email: '' }, messages)
    ).toEqual({ name: 'name', email: 'email' });
    expect(
      validateDetails({ ...details, email: 'alex@' }, messages).email
    ).toBe('emailInvalid');
  });

  it('checks the phone only when there is one', () => {
    expect(
      validateDetails({ ...details, phone: '+1 (902) 555 0123' }, messages)
    ).toEqual({});
    expect(validateDetails({ ...details, phone: 'call me' }, messages)).toEqual(
      { phone: 'phone' }
    );
  });

  it('caps the note', () => {
    expect(
      validateDetails({ ...details, note: 'x'.repeat(1001) }, messages)
    ).toEqual({ note: 'note' });
  });
});
