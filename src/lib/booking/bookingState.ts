import type { ServiceKind } from '@/content/services/catalogue';
import { isOpenSlot } from './availability';
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
  kind: FlowKind;
  /** A session's; null for a commission. */
  date: DateKey | null;
  time: string | null;
  meetOn: MeetOn;
  name: string;
  email: string;
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
  time: null,
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
  | { type: 'selectTime'; time: string }
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
  if (kind === 'session' && (!draft.date || !draft.time)) return 'date';
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

// Checks a draft read back from storage or a URL before trusting it.
export function sanitizeDraft(
  value: unknown,
  kinds: ItemKinds,
  today: DateKey
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
    isDateKey(raw.date) && raw.date > today ? (raw.date as DateKey) : null;
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
    if (fields.meetOn === 'discord') details.meetOn = 'discord';
  }

  const ready = Boolean(
    kind && (kind === 'commission' || (date !== null && time !== null))
  );
  return {
    itemId,
    date,
    time,
    details,
    detailsDone: raw.detailsDone === true && ready
  };
}
