import type { ConsultCopy } from '@/content/consult/consult';
import type { Note } from '@/lib/consult/engine';
import type { Span } from '@/components/consult/TrackStage';

export interface NoteListProps {
  copy: ConsultCopy['notes'];
  notes: Note[];
  activeId: string | null;
  /** A section marked out on the waveform, ready to become a note. */
  marking: Span | null;
  /** The playhead, in seconds: where a new note goes. */
  position: number;
  /** As many notes as one send holds. */
  full: boolean;
  onAddMoment: () => void;
  onAddSection: () => void;
  onText: (id: string, text: string) => void;
  onRemove: (id: string) => void;
  /** Picks a note, and plays from it unless `seek` is false. */
  onPick: (id: string, seek?: boolean) => void;
  /** Picks a section in the tools. */
  onTools: (id: string) => void;
}
