import type { ServiceKind } from '@/content/services/catalogue';
import { isOpenSlot } from './availability';
import { isDateKey, type DateKey } from './dates';

// A booking flow as a reducer: the step on screen plus the draft built up
// along the way. Two kinds share it: a session goes intro, item, date,
// details, payment; a commission has no date to pick. A step is only
// reachable once everything before it is filled in, so a stale URL or a
// restored draft can't skip ahead.

export type FlowKind = ServiceKind;

export const BOOKING_STEPS = [
  'intro',
  'item',
  'date',
  'details',
  'payment',
  'confirmed'
] as const;

export type BookingStep = (typeof BOOKING_STEPS)[number];

/** Every step a kind of flow goes through, in order. */
export const FLOW_STEPS: Record<FlowKind, readonly BookingStep[]> = {
  session: ['intro', 'item', 'date', 'details', 'payment', 'confirmed'],
  commission: ['intro', 'item', 'details', 'payment', 'confirmed']
};

/** The steps shown on the stepper, in order. */
export const STEPPER_STEPS = {
  session: ['item', 'date', 'details', 'payment'],
  commission: ['item', 'details', 'payment']
} as const;

export type StepperStep = 'item' | 'date' | 'details' | 'payment';

export function isBookingStep(value: unknown): value is BookingStep {
  return BOOKING_STEPS.includes(value as BookingStep);
}

export const stepIndex = (step: BookingStep, kind: FlowKind) =>
  FLOW_STEPS[kind].indexOf(step);

/** Where a session's call happens. A Meet link is made either way. */
export type MeetOn = 'meet' | 'discord';

export interface BookingDetails {
  name: string;
  email: string;
  /** Sessions only; a commission keeps the default. */
  meetOn: MeetOn;
  instagram: string;
  discord: string;
  phone: string;
  note: string;
}

export interface BookingDraft {
  itemId: string | null;
  /** Sessions only. */
  date: DateKey | null;
  time: string | null;
  details: BookingDetails;
  /** True once the details step has validated them. */
  detailsDone: boolean;
}

export interface BookingConfirmation {
  reference: string;
  itemId: string;
  /** A session's; null for a commission. */
  date: DateKey | null;
  time: string | null;
  meetOn: MeetOn;
  name: string;
  email: string;
}

export interface BookingState {
  kind: FlowKind;
  step: BookingStep;
  draft: BookingDraft;
  confirmation: BookingConfirmation | null;
  /** False until the draft kept for the tab (and the URL) has been read. */
  restored: boolean;
}

export const EMPTY_DETAILS: BookingDetails = {
  name: '',
  email: '',
  meetOn: 'meet',
  instagram: '',
  discord: '',
  phone: '',
  note: ''
};

const TEXT_FIELDS = [
  'name',
  'email',
  'instagram',
  'discord',
  'phone',
  'note'
] as const;

export const EMPTY_DRAFT: BookingDraft = {
  itemId: null,
  date: null,
  time: null,
  details: EMPTY_DETAILS,
  detailsDone: false
};

export const initialBookingState = (kind: FlowKind): BookingState => ({
  kind,
  step: 'intro',
  draft: EMPTY_DRAFT,
  confirmation: null,
  restored: false
});

export type BookingAction =
  | { type: 'selectItem'; itemId: string }
  | { type: 'selectDate'; date: DateKey }
  | { type: 'selectTime'; time: string }
  | { type: 'setDetails'; details: BookingDetails; done: boolean }
  | { type: 'goTo'; step: BookingStep }
  | { type: 'restore'; draft: BookingDraft; step: BookingStep }
  | { type: 'confirm'; confirmation: BookingConfirmation };

/** The furthest step the draft allows. */
export function furthestStep(
  draft: BookingDraft,
  kind: FlowKind,
  confirmed: boolean
): BookingStep {
  if (confirmed) return 'confirmed';
  if (!draft.itemId) return 'intro';
  if (kind === 'session' && (!draft.date || !draft.time)) return 'date';
  if (!draft.detailsDone) return 'details';
  return 'payment';
}

/** `step`, or the furthest one the draft allows if that's earlier. */
export function clampStep(
  step: BookingStep,
  draft: BookingDraft,
  kind: FlowKind,
  confirmed = false
): BookingStep {
  // Once booked there's no going back into the flow for that booking.
  if (confirmed) return 'confirmed';
  const furthest = furthestStep(draft, kind, false);
  if (step === 'confirmed' || stepIndex(step, kind) < 0) return furthest;
  return stepIndex(step, kind) > stepIndex(furthest, kind) ? furthest : step;
}

export function bookingReducer(
  state: BookingState,
  action: BookingAction
): BookingState {
  switch (action.type) {
    case 'selectItem':
      return { ...state, draft: { ...state.draft, itemId: action.itemId } };
    case 'selectDate':
      // A new day clears the time; the same day keeps it.
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
        step: clampStep(
          action.step,
          state.draft,
          state.kind,
          state.confirmation !== null
        )
      };
    case 'restore':
      return {
        ...state,
        draft: action.draft,
        step: clampStep(action.step, action.draft, state.kind),
        restored: true
      };
    case 'confirm':
      return { ...state, step: 'confirmed', confirmation: action.confirmation };
  }
}

// Checks a draft read back from storage or a URL before trusting it.
export function sanitizeDraft(
  value: unknown,
  isItem: (id: string) => boolean,
  today: DateKey,
  kind: FlowKind
): BookingDraft {
  if (!value || typeof value !== 'object') return EMPTY_DRAFT;
  const raw = value as Partial<Record<keyof BookingDraft, unknown>>;

  const itemId =
    typeof raw.itemId === 'string' && isItem(raw.itemId) ? raw.itemId : null;
  const date =
    kind === 'session' && isDateKey(raw.date) && raw.date > today
      ? (raw.date as DateKey)
      : null;
  const time =
    date && typeof raw.time === 'string' && isOpenSlot(date, raw.time, today)
      ? raw.time
      : null;

  const details = { ...EMPTY_DETAILS };
  if (raw.details && typeof raw.details === 'object') {
    const fields = raw.details as Record<string, unknown>;
    for (const key of TEXT_FIELDS) {
      if (typeof fields[key] === 'string')
        details[key] = fields[key].slice(0, 2000);
    }
    if (fields.meetOn === 'discord' && kind === 'session')
      details.meetOn = 'discord';
  }

  const ready = Boolean(itemId && (kind === 'commission' || (date && time)));
  return {
    itemId,
    date,
    time,
    details,
    detailsDone: raw.detailsDone === true && ready
  };
}
