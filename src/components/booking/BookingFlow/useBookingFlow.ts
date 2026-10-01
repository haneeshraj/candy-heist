'use client';

import {
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  useSyncExternalStore
} from 'react';
import type { ServiceItem } from '@/content/services/catalogue';
import {
  bookingReducer,
  draftKind,
  furthestStep,
  initialBookingState,
  isBookingStep,
  sanitizeDraft,
  type BookingDetails,
  type BookingStep,
  type ItemKinds
} from '@/lib/booking/bookingState';
import { completeBooking } from '@/lib/booking/completeBooking';
import { todayIn, type DateKey } from '@/lib/booking/dates';
import { clearDraft, loadDraft, saveDraft } from '@/lib/booking/persistence';

// The flow's state, kept in step with the address bar: each step is its
// own history entry (?step=date&service=dj-lessons, ?step=details&service=
// mixing), so the browser's back and forward move through the flow, and a
// link can open an item directly. The item step reads as ?step=service.
// The draft is kept for the tab, so a reload resumes it.

export const STEP_PARAM = 'step';
export const ITEM_PARAM = 'service';
/** The item step's name in the address. */
const ITEM_STEP = 'service';
// Links from before commissions and sessions shared a page.
const LEGACY_ITEM_PARAMS = ['session', 'commission'];

const noSubscribe = () => () => {};

const stepToParam = (step: BookingStep) => (step === 'item' ? ITEM_STEP : step);

function stepFromParam(value: string | null): BookingStep | null {
  if (value === ITEM_STEP || (value && LEGACY_ITEM_PARAMS.includes(value)))
    return 'item';
  return isBookingStep(value) && value !== 'item' ? value : null;
}

function linkedItem(params: URLSearchParams) {
  for (const name of [ITEM_PARAM, ...LEGACY_ITEM_PARAMS]) {
    const id = params.get(name);
    if (id) return id;
  }
  return null;
}

function urlFor(step: BookingStep, itemId: string | null) {
  const params = new URLSearchParams();
  if (step !== 'intro') params.set(STEP_PARAM, stepToParam(step));
  if (itemId && step !== 'intro') params.set(ITEM_PARAM, itemId);
  const query = params.toString();
  return `${window.location.pathname}${query ? `?${query}` : ''}`;
}

/** An item's own address, for its card. */
export const itemHref = (itemId: string) =>
  `?${STEP_PARAM}=${ITEM_STEP}&${ITEM_PARAM}=${itemId}`;

export function useBookingFlow(items: ServiceItem[], timeZone: string) {
  const kinds = useMemo<ItemKinds>(
    () => Object.fromEntries(items.map((item) => [item.id, item.kind])),
    [items]
  );
  const [state, dispatch] = useReducer(
    bookingReducer,
    kinds,
    initialBookingState
  );
  const [paying, setPaying] = useState(false);
  // Today in the sessions' zone; only known on the client.
  const today = useSyncExternalStore<DateKey | null>(
    noSubscribe,
    () => todayIn(timeZone),
    () => null
  );
  // The step the address bar was last set to; null means "replace, don't
  // push" for the next update.
  const urlStep = useRef<BookingStep | null>(null);
  // Set when a restore jumps straight to a later step: that first swap
  // should be instant, not a fade out of the intro.
  const instantSwapRef = useRef(false);

  // Restore once on the client: the draft kept for this tab, then the URL.
  useEffect(() => {
    if (!today || state.restored) return;
    const params = new URLSearchParams(window.location.search);
    let draft = sanitizeDraft(loadDraft(), kinds, today);
    const linked = linkedItem(params);
    const known = linked !== null && Object.hasOwn(kinds, linked);
    if (known && linked !== draft.itemId)
      draft = {
        ...draft,
        itemId: linked,
        // Done details belong to the kind of item they were done for.
        detailsDone:
          draft.detailsDone && kinds[linked] === draftKind(draft, kinds)
      };
    const asked = stepFromParam(params.get(STEP_PARAM));
    const step = asked ?? (known ? 'item' : 'intro');
    instantSwapRef.current = step !== 'intro';
    dispatch({ type: 'restore', draft, step });
  }, [today, state.restored, kinds]);

  // Mirror the step and the item into the address bar.
  useEffect(() => {
    if (!state.restored) return;
    const url = urlFor(state.step, state.draft.itemId);
    const current = `${window.location.pathname}${window.location.search}`;
    if (url !== current) {
      if (urlStep.current === null || urlStep.current === state.step)
        window.history.replaceState(null, '', url);
      else window.history.pushState(null, '', url);
    }
    urlStep.current = state.step;
  }, [state.restored, state.step, state.draft.itemId]);

  // Back and forward.
  useEffect(() => {
    function onPopState() {
      const params = new URLSearchParams(window.location.search);
      const linked = linkedItem(params);
      if (linked && Object.hasOwn(kinds, linked))
        dispatch({ type: 'selectItem', itemId: linked });
      urlStep.current = null;
      dispatch({
        type: 'goTo',
        step: stepFromParam(params.get(STEP_PARAM)) ?? 'intro'
      });
    }
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [kinds]);

  // Keep the draft for the tab until the booking is made.
  useEffect(() => {
    if (!state.restored) return;
    if (state.confirmation) clearDraft();
    else saveDraft(state.draft);
  }, [state.restored, state.draft, state.confirmation]);

  /** Pays; false when it didn't go through (and the flow went back). */
  async function pay() {
    if (paying) return true;
    setPaying(true);
    const kind = draftKind(state.draft, kinds);
    try {
      const confirmation = await completeBooking(state.draft, kind);
      dispatch({ type: 'confirm', confirmation });
      return true;
    } catch {
      // Something was missing after all: go back to where it is.
      dispatch({ type: 'goTo', step: furthestStep(state.draft, kind, false) });
      return false;
    } finally {
      setPaying(false);
    }
  }

  return {
    state,
    today,
    paying,
    instantSwapRef,
    /** Opens an item's details, from its card. */
    open: (itemId: string) => {
      dispatch({ type: 'selectItem', itemId });
      dispatch({ type: 'goTo', step: 'item' });
    },
    goTo: (step: BookingStep) => dispatch({ type: 'goTo', step }),
    selectDate: (date: DateKey) => dispatch({ type: 'selectDate', date }),
    selectTime: (time: string) => dispatch({ type: 'selectTime', time }),
    editDetails: (details: BookingDetails) =>
      dispatch({ type: 'setDetails', details, done: false }),
    submitDetails: (details: BookingDetails) => {
      dispatch({ type: 'setDetails', details, done: true });
      dispatch({ type: 'goTo', step: 'payment' });
    },
    pay
  };
}
