import type { ServiceKind } from '@/content/services/catalogue';
import { isDateKey, type DateKey } from './dates';

// The booking flow as a reducer: the step on screen plus the draft built
// up along the way. The picked item's kind sets the route: a 1-1 session
// goes intro, item, date, details, payment; a commission has no date to
// pick. A step is only reachable once everything before it is filled in,
// so a stale URL or a restored draft can't skip ahead.

export type FlowKind = ServiceKind;

/** Each item's kind, by id. */
export type ItemKinds = Readonly<Record<string, FlowKind>>;

export const BOOKING_STEPS = [
  'intro',
  'item',
  'date',
  'details',
  'payment',
  'confirmed'
] as const;

export type BookingStep = (typeof BOOKING_STEPS)[number];

/** Every step a kind of item goes through, in order. */
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
  /** Sessions only; a commission ignores it. */
  meetOn: MeetOn;
  instagram: string;
  discord: string;
  phone: string;
  note: string;
}

export interface BookingDraft {
  itemId: string | null;
  /** Sessions only: the day picked, as the visitor's calendar shows it. */
  date: DateKey | null;
  /** Sessions only: the time picked, as the instant it starts (ISO). */
  start: string | null;
  details: BookingDetails;
  /** True once the details step has validated them. */
  detailsDone: boolean;
}

export interface BookingConfirmation {
  reference: string;
  itemId: string;
  kind: FlowKind;
  /** A session's, as ISO instants; null for a commission. */
  start: string | null;
  end: string | null;
  /** The visitor's zone, which the page and their email read times in. */
  timeZone: string;
  meetOn: MeetOn;
  name: string;
  email: string;
  /** A commission's invoice for its other half. */
  invoiceRef: string | null;
}

export interface BookingState {
  kinds: ItemKinds;
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
  start: null,
  details: EMPTY_DETAILS,
  detailsDone: false
};

export const initialBookingState = (kinds: ItemKinds): BookingState => ({
  kinds,
  step: 'intro',
  draft: EMPTY_DRAFT,
  confirmation: null,
  restored: false
});

/** The kind of the draft's item; undefined until one is picked. */
export const draftKind = (draft: BookingDraft, kinds: ItemKinds) =>
  draft.itemId ? kinds[draft.itemId] : undefined;

export type BookingAction =
  | { type: 'selectItem'; itemId: string }
  | { type: 'selectDate'; date: DateKey }
  | { type: 'selectStart'; start: string | null }
  | { type: 'setDetails'; details: BookingDetails; done: boolean }
  | { type: 'goTo'; step: BookingStep }
  | { type: 'restore'; draft: BookingDraft; step: BookingStep }
  | { type: 'confirm'; confirmation: BookingConfirmation };

/** The furthest step the draft allows for its item's kind. */
export function furthestStep(
  draft: BookingDraft,
  kind: FlowKind | undefined,
  confirmed: boolean
): BookingStep {
  if (confirmed) return 'confirmed';
  if (!draft.itemId || !kind) return 'intro';
  if (kind === 'session' && (!draft.date || !draft.start)) return 'date';
  if (!draft.detailsDone) return 'details';
  return 'payment';
}

/** `step`, or the furthest one the draft allows if that's earlier. */
export function clampStep(
  step: BookingStep,
  draft: BookingDraft,
  kind: FlowKind | undefined,
  confirmed = false
): BookingStep {
  // Once booked there's no going back into the flow for that booking.
  if (confirmed) return 'confirmed';
  const furthest = furthestStep(draft, kind, false);
  if (!kind) return furthest;
  if (step === 'confirmed' || stepIndex(step, kind) < 0) return furthest;
  return stepIndex(step, kind) > stepIndex(furthest, kind) ? furthest : step;
}

export function bookingReducer(
  state: BookingState,
  action: BookingAction
): BookingState {
  switch (action.type) {
    case 'selectItem': {
      // Details done for one kind aren't done for the other: a session
      // asks where to meet.
      const sameKind =
        state.kinds[action.itemId] === draftKind(state.draft, state.kinds);
      return {
        ...state,
        draft: {
          ...state.draft,
          itemId: action.itemId,
          detailsDone: sameKind && state.draft.detailsDone
        }
      };
    }
    case 'selectDate':
      // A new day clears the time; the same day keeps it.
      return {
        ...state,
        draft: {
          ...state.draft,
          date: action.date,
          start: action.date === state.draft.date ? state.draft.start : null
        }
      };
    case 'selectStart':
      return { ...state, draft: { ...state.draft, start: action.start } };
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
          draftKind(state.draft, state.kinds),
          state.confirmation !== null
        )
      };
    case 'restore':
      return {
        ...state,
        draft: action.draft,
        step: clampStep(
          action.step,
          action.draft,
          draftKind(action.draft, state.kinds)
        ),
        restored: true
      };
    case 'confirm':
      return { ...state, step: 'confirmed', confirmation: action.confirmation };
  }
}

// Checks a draft read back from storage or a URL before trusting it. A
// time that's kept is checked again against what's open when the date
// step shows it, and once more when it's paid for.
export function sanitizeDraft(
  value: unknown,
  kinds: ItemKinds,
  today: DateKey,
  now: number = Date.now()
): BookingDraft {
  if (!value || typeof value !== 'object') return EMPTY_DRAFT;
  const raw = value as Partial<Record<keyof BookingDraft, unknown>>;

  const itemId =
    typeof raw.itemId === 'string' && Object.hasOwn(kinds, raw.itemId)
      ? raw.itemId
      : null;
  const kind = itemId ? kinds[itemId] : undefined;
  // A date and time are kept whatever the item, so they survive a look at
  // a commission on the way back to a session.
  const date =
    isDateKey(raw.date) && raw.date >= today ? (raw.date as DateKey) : null;
  const start =
    date &&
    typeof raw.start === 'string' &&
    raw.start.length <= 40 &&
    Date.parse(raw.start) > now
      ? new Date(raw.start).toISOString()
      : null;

  const details = { ...EMPTY_DETAILS };
  if (raw.details && typeof raw.details === 'object') {
    const fields = raw.details as Record<string, unknown>;
    for (const key of TEXT_FIELDS) {
      if (typeof fields[key] === 'string')
        details[key] = fields[key].slice(0, 2000);
    }
    if (fields.meetOn === 'discord') details.meetOn = 'discord';
  }

  const ready = Boolean(
    kind && (kind === 'commission' || (date !== null && start !== null))
  );
  return {
    itemId,
    date,
    start,
    details,
    detailsDone: raw.detailsDone === true && ready
  };
}
