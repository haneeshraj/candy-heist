import type { BookingDraft } from './bookingState';

// Keeps the booking draft for the length of the tab, so a reload mid-way
// picks up where it left off. Storage can be missing or blocked (private
// modes, strict settings), so every access is allowed to fail quietly.

export const DRAFT_KEY = 'candy-heist:booking-draft';

export function saveDraft(draft: BookingDraft) {
  try {
    window.sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch {
    // Not critical: the flow works without it.
  }
}

export function loadDraft(): unknown {
  try {
    const raw = window.sessionStorage.getItem(DRAFT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearDraft() {
  try {
    window.sessionStorage.removeItem(DRAFT_KEY);
  } catch {
    // Nothing to clear.
  }
}
