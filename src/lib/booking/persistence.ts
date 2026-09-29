import type { BookingDraft } from './bookingState';

// Keeps the draft for the length of the tab, so a reload mid-booking picks
// up where it left off. Storage can be missing or blocked (private modes,
// strict settings), so every access is allowed to fail quietly.

const KEY = 'candy-heist:booking-draft';

export function saveDraft(draft: BookingDraft) {
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify(draft));
  } catch {
    // Not critical: the flow works without it.
  }
}

export function loadDraft(): unknown {
  try {
    const raw = window.sessionStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearDraft() {
  try {
    window.sessionStorage.removeItem(KEY);
  } catch {
    // Nothing to clear.
  }
}
