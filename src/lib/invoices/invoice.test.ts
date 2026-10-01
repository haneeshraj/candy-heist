import { describe, expect, it } from 'vitest';
import { invoiceAmounts, isInvoiceId, normalizeInvoiceId } from './invoice';
import { findInvoice, InvoiceNotFoundError } from './payInvoice';

describe('invoice IDs', () => {
  it('tidies an ID as typed', () => {
    expect(normalizeInvoiceId('  ch-7q4k 2m9x ')).toBe('CH-7Q4K2M9X');
  });

  it('takes letters, digits and dashes, and nothing too short', () => {
    expect(isInvoiceId('CH-7Q4K2M9X')).toBe(true);
    expect(isInvoiceId('ab1')).toBe(false);
    expect(isInvoiceId('CH 7Q4K!')).toBe(false);
  });
});

describe('findInvoice', () => {
  it('finds an ID in the right shape, and refuses any other', async () => {
    await expect(findInvoice(' ch-7q4k2m9x')).resolves.toMatchObject({
      id: 'CH-7Q4K2M9X'
    });
    await expect(findInvoice('??')).rejects.toBeInstanceOf(
      InvoiceNotFoundError
    );
  });
});

describe('invoiceAmounts', () => {
  it('shows what it knows, and the placeholder for the rest', () => {
    expect(
      invoiceAmounts(
        {
          id: 'CH-1',
          itemName: 'Mixing',
          totalCents: 5000,
          paidCents: 2500,
          dueCents: 2500
        },
        '$ –'
      )
    ).toEqual({ price: '$50', paid: '$25', due: '$25' });
    expect(invoiceAmounts({ id: 'CH-1', itemName: null }, '$ –').due).toBe(
      '$ –'
    );
  });
});
