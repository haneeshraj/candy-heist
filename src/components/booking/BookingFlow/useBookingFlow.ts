'use client';

import {
  useEffect,
  useReducer,
  useRef,
  useState,
  useSyncExternalStore
} from 'react';
import type { ServiceItem } from '@/content/services/catalogue';
import {
  bookingReducer,
  furthestStep,
  initialBookingState,
  isBookingStep,
  sanitizeDraft,
  type BookingDetails,
  type BookingStep,
  type FlowKind
} from '@/lib/booking/bookingState';
import { completeBooking } from '@/lib/booking/completeBooking';
import { todayIn, type DateKey } from '@/lib/booking/dates';
import { clearDraft, loadDraft, saveDraft } from '@/lib/booking/persistence';

// A flow's state, kept in step with the address bar: each step is its own
// history entry (?step=date&session=dj-lessons, ?step=details&commission=
// mixing), so the browser's back and forward move through the flow, and a
// link can open an item directly. The item step reads as the flow's kind
// (?step=session). The draft is kept for the tab, so a reload resumes it.

export const STEP_PARAM = 'step';

const noSubscribe = () => () => {};

const stepToParam = (step: BookingStep, kind: FlowKind) =>
  step === 'item' ? kind : step;

function stepFromParam(value: string | null, kind: FlowKind) {
  if (value === kind) return 'item';
  return isBookingStep(value) && value !== 'item' ? value : null;
}

function urlFor(step: BookingStep, itemId: string | null, kind: FlowKind) {
  const params = new URLSearchParams();
  if (step !== 'intro') params.set(STEP_PARAM, stepToParam(step, kind));
  if (itemId) params.set(kind, itemId);
  const query = params.toString();
  return `${window.location.pathname}${query ? `?${query}` : ''}`;
}

export function useBookingFlow(
  kind: FlowKind,
  items: ServiceItem[],
  timeZone: string
) {
  const [state, dispatch] = useReducer(
    bookingReducer,
    kind,
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

  const isItem = (id: string) => items.some((item) => item.id === id);

  // Restore once on the client: the draft kept for this tab, then the URL.
  useEffect(() => {
    if (!today || state.restored) return;
    const params = new URLSearchParams(window.location.search);
    const draft = sanitizeDraft(loadDraft(kind), isItem, today, kind);
    const linked = params.get(kind);
    if (linked && isItem(linked)) draft.itemId = linked;
    const asked = stepFromParam(params.get(STEP_PARAM), kind);
    const step = asked ?? (linked ? 'item' : 'intro');
    instantSwapRef.current = step !== 'intro';
    dispatch({ type: 'restore', draft, step });
    // isItem only reads the items prop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [today, state.restored, kind]);

  // Mirror the step and the item into the address bar.
  useEffect(() => {
    if (!state.restored) return;
    const url = urlFor(state.step, state.draft.itemId, kind);
    const current = `${window.location.pathname}${window.location.search}`;
    if (url !== current) {
      if (urlStep.current === null || urlStep.current === state.step)
        window.history.replaceState(null, '', url);
      else window.history.pushState(null, '', url);
    }
    urlStep.current = state.step;
  }, [state.restored, state.step, state.draft.itemId, kind]);

  // Back and forward.
  useEffect(() => {
    function onPopState() {
      const params = new URLSearchParams(window.location.search);
      const linked = params.get(kind);
      if (linked && items.some((item) => item.id === linked))
        dispatch({ type: 'selectItem', itemId: linked });
      urlStep.current = null;
      dispatch({
        type: 'goTo',
        step: stepFromParam(params.get(STEP_PARAM), kind) ?? 'intro'
      });
    }
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [items, kind]);

  // Keep the draft for the tab until the booking is made.
  useEffect(() => {
    if (!state.restored) return;
    if (state.confirmation) clearDraft(kind);
    else saveDraft(kind, state.draft);
  }, [state.restored, state.draft, state.confirmation, kind]);

  async function pay() {
    if (paying) return;
    setPaying(true);
    try {
      const confirmation = await completeBooking(state.draft, kind);
      dispatch({ type: 'confirm', confirmation });
    } catch {
      // Something was missing after all: go back to where it is.
      dispatch({ type: 'goTo', step: furthestStep(state.draft, kind, false) });
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
    selectItem: (itemId: string) => dispatch({ type: 'selectItem', itemId }),
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
