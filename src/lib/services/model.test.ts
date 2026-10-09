import { describe, expect, it } from 'vitest';
import { fileServices } from '@/content/services/catalogue';
import { fileHours } from '@/content/services/hours';
import {
  publishedHoursOf,
  publishServicesSchema,
  readServiceItem,
  serviceItemSchema
} from './model';

// What a service and the hours have to be before the site shows them,
// whoever sent them.

const [mixing] = fileServices;
const session = fileServices.find((item) => item.kind === 'session')!;
const hours = publishedHoursOf(fileHours);
const publish = (patch: object = {}) => ({
  items: fileServices,
  hours,
  baseRevision: 0,
  ...patch
});

describe('a service', () => {
  it('takes a price in dollars and cents, or none', () => {
    expect(
      serviceItemSchema.safeParse({ ...mixing, price: 120.5 }).success
    ).toBe(true);
    expect(
      serviceItemSchema.safeParse({ ...mixing, price: undefined }).success
    ).toBe(true);
    expect(serviceItemSchema.safeParse({ ...mixing, price: 0 }).success).toBe(
      false
    );
    expect(
      serviceItemSchema.safeParse({ ...mixing, price: 99.999 }).success
    ).toBe(false);
  });

  it('keeps an address of lowercase words, and a session its length', () => {
    expect(
      serviceItemSchema.safeParse({ ...mixing, id: 'Mixing Plus' }).success
    ).toBe(false);
    expect(
      serviceItemSchema.safeParse({ ...session, durationMinutes: 10 }).success
    ).toBe(false);
    expect(
      serviceItemSchema.safeParse({ ...session, durationMinutes: undefined })
        .success
    ).toBe(false);
  });

  it('says what’s missing in words Haven can show', () => {
    const result = serviceItemSchema.safeParse({ ...mixing, name: '  ' });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe('A service needs a name');
  });

  it('reads its write-up, and refuses one the pages can’t show', () => {
    expect(readServiceItem(mixing).blocks.length).toBeGreaterThan(0);
    expect(() =>
      readServiceItem({ ...mixing, body: '| a | b |\n|---|---|\n| 1 | 2 |' })
    ).toThrow(/write-up for Mixing/);
  });
});

describe('a publish', () => {
  it('takes the whole list and the hours, from a revision', () => {
    const parsed = publishServicesSchema.safeParse(publish());
    expect(parsed.success).toBe(true);
    expect(parsed.data?.force).toBe(false);
  });

  it('keeps at least one service, each at its own address', () => {
    expect(
      publishServicesSchema.safeParse(publish({ items: [] })).success
    ).toBe(false);
    expect(
      publishServicesSchema.safeParse(publish({ items: [mixing, mixing] }))
        .success
    ).toBe(false);
  });

  it('leaves the hold while someone pays to the site', () => {
    expect(hours).not.toHaveProperty('holdMinutes');
    expect(
      publishServicesSchema.safeParse(
        publish({ hours: { ...hours, holdMinutes: 1 } })
      ).data?.hours
    ).not.toHaveProperty('holdMinutes');
  });

  it('refuses a day with the same time twice, or a time that isn’t one', () => {
    const twice = {
      ...hours,
      weekly: { ...hours.weekly, mon: ['10:00', '10:00'] }
    };
    expect(
      publishServicesSchema.safeParse(publish({ hours: twice })).success
    ).toBe(false);
    const wrong = { ...hours, weekly: { ...hours.weekly, mon: ['25:00'] } };
    expect(
      publishServicesSchema.safeParse(publish({ hours: wrong })).success
    ).toBe(false);
  });
});
