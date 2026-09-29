import { isOpenSlot } from './availability';
import { isDateKey, type DateKey } from './dates';

// The booking flow as a reducer: the step on screen plus the draft built up
// along the way. A step is only reachable once everything before it is
// filled in, so a stale URL or a restored draft can't skip ahead.

export const BOOKING_STEPS = [
  'intro',
  'session',
  'date',
  'details',
  'payment',
  'confirmed'
] as const;

export type BookingStep = (typeof BOOKING_STEPS)[number];

/** The steps shown on the stepper, in order. */
export const STEPPER_STEPS = ['session', 'date', 'details', 'payment'] as const;
export type StepperStep = (typeof STEPPER_STEPS)[number];

export function isBookingStep(value: unknown): value is BookingStep {
  return BOOKING_STEPS.includes(value as BookingStep);
}

export const stepIndex = (step: BookingStep) => BOOKING_STEPS.indexOf(step);

export interface BookingDetails {
  name: string;
  email: string;
  phone: string;
  note: string;
}

export interface BookingDraft {
  serviceId: string | null;
  date: DateKey | null;
  time: string | null;
  details: BookingDetails;
  /** True once the details step has validated them. */
  detailsDone: boolean;
}

export interface BookingConfirmation {
  reference: string;
  serviceId: string;
  date: DateKey;
  time: string;
  name: string;
  email: string;
}

export interface BookingState {
  step: BookingStep;
  draft: BookingDraft;
  confirmation: BookingConfirmation | null;
  /** False until the draft kept for the tab (and the URL) has been read. */
  restored: boolean;
}

export const EMPTY_DETAILS: BookingDetails = {
  name: '',
  email: '',
  phone: '',
  note: ''
};

export const initialBookingState: BookingState = {
  step: 'intro',
  draft: {
    serviceId: null,
    date: null,
    time: null,
    details: EMPTY_DETAILS,
    detailsDone: false
  },
  confirmation: null,
  restored: false
};

export type BookingAction =
  | { type: 'selectService'; serviceId: string }
  | { type: 'selectDate'; date: DateKey }
  | { type: 'selectTime'; time: string }
  | { type: 'setDetails'; details: BookingDetails; done: boolean }
  | { type: 'goTo'; step: BookingStep }
  | { type: 'restore'; draft: BookingDraft; step: BookingStep }
  | { type: 'confirm'; confirmation: BookingConfirmation };

/** The furthest step the draft allows. */
export function furthestStep(
  draft: BookingDraft,
  confirmed: boolean
): BookingStep {
  if (confirmed) return 'confirmed';
  if (!draft.serviceId) return 'intro';
  if (!draft.date || !draft.time) return 'date';
  if (!draft.detailsDone) return 'details';
  return 'payment';
}

/** `step`, or the furthest one the draft allows if that's earlier. */
export function clampStep(
  step: BookingStep,
  draft: BookingDraft,
  confirmed = false
): BookingStep {
  const furthest = furthestStep(draft, confirmed);
  // Once booked there's no going back into the flow for that booking.
  if (confirmed) return 'confirmed';
  if (step === 'confirmed') return furthest;
  return stepIndex(step) > stepIndex(furthest) ? furthest : step;
}

export function bookingReducer(
  state: BookingState,
  action: BookingAction
): BookingState {
  switch (action.type) {
    case 'selectService':
      return {
        ...state,
        draft: { ...state.draft, serviceId: action.serviceId }
      };
    case 'selectDate':
      // A new day keeps the time only if it's open there too (checked by
      // the caller); the flow simply clears it on any change of day.
      return {
        ...state,
        draft: {
          ...state.draft,
          date: action.date,
          time: action.date === state.draft.date ? state.draft.time : null
        }
      };
    case 'selectTime':
      return { ...state, draft: { ...state.draft, time: action.time } };
    case 'setDetails':
      return {
        ...state,
        draft: {
          ...state.draft,
          details: action.details,
          detailsDone: action.done
        }
      };
    case 'goTo':
      return {
        ...state,
        step: clampStep(action.step, state.draft, state.confirmation !== null)
      };
    case 'restore':
      return {
        ...state,
        draft: action.draft,
        step: clampStep(action.step, action.draft),
        restored: true
      };
    case 'confirm':
      return { ...state, step: 'confirmed', confirmation: action.confirmation };
  }
}

// Checks a draft read back from storage or a URL before trusting it.
export function sanitizeDraft(
  value: unknown,
  isService: (id: string) => boolean,
  today: DateKey
): BookingDraft {
  const empty = initialBookingState.draft;
  if (!value || typeof value !== 'object') return empty;
  const raw = value as Partial<Record<keyof BookingDraft, unknown>>;

  const serviceId =
    typeof raw.serviceId === 'string' && isService(raw.serviceId)
      ? raw.serviceId
      : null;
  const date =
    isDateKey(raw.date) && raw.date > today ? (raw.date as DateKey) : null;
  const time =
    date && typeof raw.time === 'string' && isOpenSlot(date, raw.time, today)
      ? raw.time
      : null;

  const details = { ...EMPTY_DETAILS };
  if (raw.details && typeof raw.details === 'object') {
    for (const key of Object.keys(EMPTY_DETAILS) as Array<
      keyof BookingDetails
    >) {
      const field = (raw.details as Record<string, unknown>)[key];
      if (typeof field === 'string') details[key] = field.slice(0, 2000);
    }
  }

  return {
    serviceId,
    date,
    time,
    details,
    detailsDone: raw.detailsDone === true && Boolean(serviceId && date && time)
  };
}
