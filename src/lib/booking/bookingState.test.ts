import { describe, expect, it } from 'vitest';
import {
  bookingReducer,
  clampStep,
  furthestStep,
  initialBookingState,
  sanitizeDraft,
  type BookingDraft
} from './bookingState';

const TODAY = '2026-09-28';
const isService = (id: string) => id === 'dj-lessons';

const draft = (patch: Partial<BookingDraft> = {}): BookingDraft => ({
  ...initialBookingState.draft,
  ...patch
});

describe('booking steps', () => {
  it('only reaches a step once everything before it is filled in', () => {
    expect(furthestStep(draft(), false)).toBe('intro');
    expect(furthestStep(draft({ serviceId: 'dj-lessons' }), false)).toBe(
      'date'
    );
    expect(
      furthestStep(
        draft({ serviceId: 'dj-lessons', date: '2026-10-01', time: '10:00' }),
        false
      )
    ).toBe('details');
  });

  it('pulls a step that skips ahead back to the furthest allowed', () => {
    expect(clampStep('payment', draft({ serviceId: 'dj-lessons' }))).toBe(
      'date'
    );
    expect(clampStep('session', draft({ serviceId: 'dj-lessons' }))).toBe(
      'session'
    );
  });

  it('keeps a confirmed booking on its confirmation', () => {
    expect(clampStep('payment', draft(), true)).toBe('confirmed');
  });
});

describe('bookingReducer', () => {
  it('clears the time when the day changes', () => {
    let state = bookingReducer(initialBookingState, {
      type: 'selectDate',
      date: '2026-10-01'
    });
    state = bookingReducer(state, { type: 'selectTime', time: '14:00' });
    expect(state.draft.time).toBe('14:00');

    state = bookingReducer(state, { type: 'selectDate', date: '2026-10-02' });
    expect(state.draft.time).toBeNull();
  });

  it('marks the state restored and clamps the restored step', () => {
    const state = bookingReducer(initialBookingState, {
      type: 'restore',
      draft: draft({ serviceId: 'dj-lessons' }),
      step: 'payment'
    });
    expect(state.restored).toBe(true);
    expect(state.step).toBe('date');
  });
});

describe('sanitizeDraft', () => {
  it('keeps only a known service, a future bookable day and an open time', () => {
    const clean = sanitizeDraft(
      {
        serviceId: 'dj-lessons',
        date: '2026-10-01',
        time: '99:99',
        details: { name: 'Alex', email: 5 },
        detailsDone: true
      },
      isService,
      TODAY
    );
    expect(clean.serviceId).toBe('dj-lessons');
    expect(clean.date).toBe('2026-10-01');
    expect(clean.time).toBeNull();
    expect(clean.details).toEqual({
      name: 'Alex',
      email: '',
      phone: '',
      note: ''
    });
    // Details can't count as done without a time.
    expect(clean.detailsDone).toBe(false);
  });

  it('drops anything that is not a draft', () => {
    expect(sanitizeDraft('nonsense', isService, TODAY)).toEqual(
      initialBookingState.draft
    );
    expect(
      sanitizeDraft(
        { serviceId: 'trumpet', date: '2026-13-40' },
        isService,
        TODAY
      )
    ).toMatchObject({ serviceId: null, date: null });
  });
});
