import {
  chainIsEmpty,
  emptyChain,
  parseChain,
  type Chain,
  type Note
} from '@/lib/consult/engine';

// What a producer has written so far, kept in his own browser while he
// works, so a reload or a closed tab doesn't lose an evening's notes. Only
// for this link, and gone once it's sent. Read back loosely: a draft is
// unfinished by nature, so a note with nothing in it yet is still kept.

export interface Draft {
  notes: Note[];
  chain: Chain;
}

export const draftKey = (token: string) => `candy-heist:consult:${token}`;

function readNote(raw: unknown): Note | null {
  if (!raw || typeof raw !== 'object') return null;
  const note = raw as Record<string, unknown>;
  if (typeof note.id !== 'string' || typeof note.at !== 'number') return null;
  const end = typeof note.end === 'number' ? note.end : null;
  return {
    id: note.id,
    at: note.at,
    end,
    text: typeof note.text === 'string' ? note.text : '',
    chain: end === null ? null : (parseChain(note.chain) ?? emptyChain())
  };
}

export function loadDraft(token: string): Draft | null {
  try {
    const raw = window.localStorage.getItem(draftKey(token));
    if (!raw) return null;
    const saved = JSON.parse(raw) as { notes?: unknown; chain?: unknown };
    const notes = Array.isArray(saved.notes)
      ? saved.notes.map(readNote).filter((note) => note !== null)
      : [];
    return { notes, chain: parseChain(saved.chain) ?? emptyChain() };
  } catch {
    return null;
  }
}

export function saveDraft(token: string, draft: Draft) {
  try {
    const empty = draft.notes.length === 0 && chainIsEmpty(draft.chain);
    if (empty) window.localStorage.removeItem(draftKey(token));
    else window.localStorage.setItem(draftKey(token), JSON.stringify(draft));
  } catch {
    // Private windows and full storage: the draft just isn't kept.
  }
}

export function clearDraft(token: string) {
  try {
    window.localStorage.removeItem(draftKey(token));
  } catch {
    // Nothing to clear.
  }
}
