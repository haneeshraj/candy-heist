import { describe, expect, it } from 'vitest';
import {
  bookingReducer,
  clampStep,
  EMPTY_DETAILS,
  EMPTY_DRAFT,
  furthestStep,
  initialBookingState,
  sanitizeDraft,
  type BookingDraft,
  type ItemKinds
} from './bookingState';

const TODAY = '2026-09-28';
const KINDS: ItemKinds = { 'dj-lessons': 'session', mixing: 'commission' };

const draft = (patch: Partial<BookingDraft> = {}): BookingDraft => ({
  ...EMPTY_DRAFT,
  ...patch
});

describe('booking steps', () => {
  it('only reaches a session step once everything before it is filled in', () => {
    expect(furthestStep(draft(), undefined, false)).toBe('intro');
    expect(
      furthestStep(draft({ itemId: 'dj-lessons' }), 'session', false)
    ).toBe('date');
    expect(
      furthestStep(
        draft({ itemId: 'dj-lessons', date: '2026-10-01', time: '10:00' }),
        'session',
        false
      )
    ).toBe('details');
  });

  it('takes a commission straight from its item to the details', () => {
    expect(furthestStep(draft({ itemId: 'mixing' }), 'commission', false)).toBe(
      'details'
    );
    expect(
      furthestStep(
        draft({ itemId: 'mixing', detailsDone: true }),
        'commission',
        false
      )
    ).toBe('payment');
  });

  it('pulls a step that skips ahead back to the furthest allowed', () => {
    expect(
      clampStep('payment', draft({ itemId: 'dj-lessons' }), 'session')
    ).toBe('date');
    expect(clampStep('item', draft({ itemId: 'dj-lessons' }), 'session')).toBe(
      'item'
    );
  });

  it('keeps everything on the intro until an item is picked', () => {
    expect(clampStep('details', draft(), undefined)).toBe('intro');
  });

  it('never shows a commission the date step', () => {
    expect(clampStep('date', draft({ itemId: 'mixing' }), 'commission')).toBe(
      'details'
    );
  });

  it('keeps a confirmed booking on its confirmation', () => {
    expect(clampStep('payment', draft(), 'session', true)).toBe('confirmed');
  });
});

describe('bookingReducer', () => {
  it('clears the time when the day changes', () => {
    let state = bookingReducer(initialBookingState(KINDS), {
      type: 'selectDate',
      date: '2026-10-01'
    });
    state = bookingReducer(state, { type: 'selectTime', time: '14:00' });
    expect(state.draft.time).toBe('14:00');

    state = bookingReducer(state, { type: 'selectDate', date: '2026-10-02' });
    expect(state.draft.time).toBeNull();
  });

  it('follows the picked item’s kind when clamping', () => {
    let state = bookingReducer(initialBookingState(KINDS), {
      type: 'selectItem',
      itemId: 'mixing'
    });
    state = bookingReducer(state, { type: 'goTo', step: 'details' });
    expect(state.step).toBe('details');

    state = bookingReducer(state, { type: 'selectItem', itemId: 'dj-lessons' });
    state = bookingReducer(state, { type: 'goTo', step: 'details' });
    expect(state.step).toBe('date');
  });

  it('asks for the details again when the kind of item changes', () => {
    let state = bookingReducer(initialBookingState(KINDS), {
      type: 'restore',
      draft: draft({ itemId: 'mixing', detailsDone: true }),
      step: 'payment'
    });
    expect(state.step).toBe('payment');

    state = bookingReducer(state, { type: 'selectItem', itemId: 'dj-lessons' });
    expect(state.draft.detailsDone).toBe(false);
  });

  it('marks the state restored and clamps the restored step', () => {
    const state = bookingReducer(initialBookingState(KINDS), {
      type: 'restore',
      draft: draft({ itemId: 'dj-lessons' }),
      step: 'payment'
    });
    expect(state.restored).toBe(true);
    expect(state.step).toBe('date');
  });
});

describe('sanitizeDraft', () => {
  it('keeps only a known item, a future bookable day and an open time', () => {
    const clean = sanitizeDraft(
      {
        itemId: 'dj-lessons',
        date: '2026-10-01',
        time: '99:99',
        details: { name: 'Alex', email: 5, meetOn: 'discord', discord: 'alex' },
        detailsDone: true
      },
      KINDS,
      TODAY
    );
    expect(clean.itemId).toBe('dj-lessons');
    expect(clean.date).toBe('2026-10-01');
    expect(clean.time).toBeNull();
    expect(clean.details).toEqual({
      ...EMPTY_DETAILS,
      name: 'Alex',
      meetOn: 'discord',
      discord: 'alex'
    });
    // Details can't count as done without a time.
    expect(clean.detailsDone).toBe(false);
  });

  it('lets a commission’s details count without a date', () => {
    const clean = sanitizeDraft(
      { itemId: 'mixing', details: { name: 'Alex' }, detailsDone: true },
      KINDS,
      TODAY
    );
    expect(clean.detailsDone).toBe(true);
  });

  it('drops anything that is not a draft', () => {
    expect(sanitizeDraft('nonsense', KINDS, TODAY)).toEqual(EMPTY_DRAFT);
    expect(
      sanitizeDraft(
        { itemId: 'trumpet', date: '2026-13-40', detailsDone: true },
        KINDS,
        TODAY
      )
    ).toMatchObject({ itemId: null, date: null, detailsDone: false });
    expect(sanitizeDraft({ itemId: 'toString' }, KINDS, TODAY).itemId).toBe(
      null
    );
  });
});
