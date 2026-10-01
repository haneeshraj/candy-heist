import { describe, expect, it } from 'vitest';
import { amountsFor, chargeFor, formatAmount } from './price';

describe('chargeFor', () => {
  it('takes half of a commission upfront, the rest on delivery', () => {
    expect(chargeFor('commission', 50)).toEqual({
      total: 5000,
      now: 2500,
      later: 2500
    });
  });

  it('takes a 1-1 session in full', () => {
    expect(chargeFor('session', 50)).toEqual({
      total: 5000,
      now: 5000,
      later: 0
    });
  });

  it('puts an odd cent on the advance', () => {
    expect(chargeFor('commission', 25.25)).toEqual({
      total: 2525,
      now: 1263,
      later: 1262
    });
  });
});

describe('formatAmount', () => {
  it('drops the cents on a whole amount, keeps them otherwise', () => {
    expect(formatAmount(5000)).toBe('$50');
    expect(formatAmount(1250)).toBe('$12.50');
    expect(formatAmount(150000)).toBe('$1,500');
  });
});

describe('amountsFor', () => {
  it('shows a commission’s price, advance and remainder', () => {
    expect(amountsFor('commission', 50, '$ –')).toEqual({
      price: '$50',
      now: '$25',
      later: '$25'
    });
  });

  it('leaves nothing for later on a session', () => {
    expect(amountsFor('session', 50, '$ –')).toEqual({
      price: '$50',
      now: '$50',
      later: null
    });
  });

  it('shows the placeholder while the price is unset', () => {
    expect(amountsFor('commission', undefined, '$ –')).toEqual({
      price: '$ –',
      now: '$ –',
      later: '$ –'
    });
  });
});
