import type { BookingDraft, FlowKind } from './bookingState';

// Keeps each flow's draft for the length of the tab, so a reload mid-way
// picks up where it left off. Storage can be missing or blocked (private
// modes, strict settings), so every access is allowed to fail quietly.

const key = (kind: FlowKind) => `candy-heist:${kind}-draft`;

export function saveDraft(kind: FlowKind, draft: BookingDraft) {
  try {
    window.sessionStorage.setItem(key(kind), JSON.stringify(draft));
  } catch {
    // Not critical: the flow works without it.
  }
}

export function loadDraft(kind: FlowKind): unknown {
  try {
    const raw = window.sessionStorage.getItem(key(kind));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearDraft(kind: FlowKind) {
  try {
    window.sessionStorage.removeItem(key(kind));
  } catch {
    // Nothing to clear.
  }
}
