import { describe, expect, it } from 'vitest';
import { EMPTY_DETAILS } from './bookingState';
import { validateDetails } from './validation';

const messages = {
  name: 'name',
  email: 'email',
  emailInvalid: 'emailInvalid',
  instagram: 'instagram',
  discord: 'discord',
  discordRequired: 'discordRequired',
  phone: 'phone',
  note: 'note'
};

const details = {
  ...EMPTY_DETAILS,
  name: 'Alex Martin',
  email: 'alex@example.com'
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

  it('checks handles only when they are there, forgiving a leading @', () => {
    expect(
      validateDetails(
        { ...details, instagram: '@alex.martin', discord: 'alex_m' },
        messages
      )
    ).toEqual({});
    expect(
      validateDetails(
        { ...details, instagram: 'alex martin', discord: 'a' },
        messages
      )
    ).toEqual({ instagram: 'instagram', discord: 'discord' });
  });

  it('needs the Discord username when Discord is where to meet', () => {
    expect(
      validateDetails({ ...details, meetOn: 'discord' }, messages)
    ).toEqual({ discord: 'discordRequired' });
    expect(
      validateDetails(
        { ...details, meetOn: 'discord', discord: 'alexmartin' },
        messages
      )
    ).toEqual({});
  });

  it('caps the note', () => {
    expect(
      validateDetails({ ...details, note: 'x'.repeat(1001) }, messages)
    ).toEqual({ note: 'note' });
  });
});
