'use client';

import {
  useEffect,
  useReducer,
  useRef,
  useState,
  useSyncExternalStore
} from 'react';
import type { Service } from '@/content/sessions/services';
import {
  bookingReducer,
  furthestStep,
  initialBookingState,
  isBookingStep,
  sanitizeDraft,
  type BookingDetails,
  type BookingStep
} from '@/lib/booking/bookingState';
import { completeBooking } from '@/lib/booking/completeBooking';
import { todayIn, type DateKey } from '@/lib/booking/dates';
import { clearDraft, loadDraft, saveDraft } from '@/lib/booking/persistence';

// The booking flow's state, kept in step with the address bar: each step is
// its own history entry (?step=date&session=dj-lessons), so the browser's
// back and forward move through the flow, and a link can open a session
// directly. The draft is kept for the tab, so a reload resumes it.

export const STEP_PARAM = 'step';
export const SESSION_PARAM = 'session';

const noSubscribe = () => () => {};

function urlFor(step: BookingStep, serviceId: string | null) {
  const params = new URLSearchParams();
  if (step !== 'intro') params.set(STEP_PARAM, step);
  if (serviceId) params.set(SESSION_PARAM, serviceId);
  const query = params.toString();
  return `${window.location.pathname}${query ? `?${query}` : ''}`;
}

export function useBookingFlow(services: Service[], timeZone: string) {
  const [state, dispatch] = useReducer(bookingReducer, initialBookingState);
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

  const isService = (id: string) => services.some((s) => s.id === id);

  // Restore once on the client: the draft kept for this tab, then the URL.
  useEffect(() => {
    if (!today || state.restored) return;
    const params = new URLSearchParams(window.location.search);
    const draft = sanitizeDraft(loadDraft(), isService, today);
    const linked = params.get(SESSION_PARAM);
    if (linked && isService(linked)) draft.serviceId = linked;
    const asked = params.get(STEP_PARAM);
    const step = isBookingStep(asked) ? asked : linked ? 'session' : 'intro';
    instantSwapRef.current = step !== 'intro';
    dispatch({ type: 'restore', draft, step });
    // isService only reads the services prop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [today, state.restored]);

  // Mirror the step and session into the address bar.
  useEffect(() => {
    if (!state.restored) return;
    const url = urlFor(state.step, state.draft.serviceId);
    const current = `${window.location.pathname}${window.location.search}`;
    if (url !== current) {
      if (urlStep.current === null || urlStep.current === state.step)
        window.history.replaceState(null, '', url);
      else window.history.pushState(null, '', url);
    }
    urlStep.current = state.step;
  }, [state.restored, state.step, state.draft.serviceId]);

  // Back and forward.
  useEffect(() => {
    function onPopState() {
      const params = new URLSearchParams(window.location.search);
      const linked = params.get(SESSION_PARAM);
      if (linked && services.some((s) => s.id === linked))
        dispatch({ type: 'selectService', serviceId: linked });
      const asked = params.get(STEP_PARAM);
      urlStep.current = null;
      dispatch({ type: 'goTo', step: isBookingStep(asked) ? asked : 'intro' });
    }
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [services]);

  // Keep the draft for the tab until the booking is made.
  useEffect(() => {
    if (!state.restored) return;
    if (state.confirmation) clearDraft();
    else saveDraft(state.draft);
  }, [state.restored, state.draft, state.confirmation]);

  async function pay() {
    if (paying) return;
    setPaying(true);
    try {
      const confirmation = await completeBooking(state.draft);
      dispatch({ type: 'confirm', confirmation });
    } catch {
      // Something was missing after all: go back to where it is.
      dispatch({ type: 'goTo', step: furthestStep(state.draft, false) });
    } finally {
      setPaying(false);
    }
  }

  return {
    state,
    today,
    paying,
    instantSwapRef,
    selectService: (serviceId: string) =>
      dispatch({ type: 'selectService', serviceId }),
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
