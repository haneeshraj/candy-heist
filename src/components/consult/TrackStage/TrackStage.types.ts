import type { ReactNode, RefObject } from 'react';
import type { ConsultCopy } from '@/content/consult/consult';
import type { Note } from '@/lib/consult/engine';

/** A stretch of the track, in seconds: a section being marked out. */
export interface Span {
  from: number;
  to: number;
}

export interface TrackStageProps {
  copy: ConsultCopy['room'];
  /** The compact waveform (engine/peaks.ts). */
  waveform: Uint8Array;
  duration: number;
  /** The playhead, read each frame while it plays. */
  positionRef: RefObject<number>;
  /** The playhead's whole second, for the clock. */
  second: number;
  playing: boolean;
  failed: boolean;
  notes: Note[];
  activeId: string | null;
  marking: Span | null;
  /** Hearing the track as it is, without his tools. */
  bypass: boolean;
  /** Whether any tool is on, so there's a before and after to hear. */
  canCompare: boolean;
  onBypass: (on: boolean) => void;
  onToggle: () => void;
  onSeek: (seconds: number) => void;
  /** A section being marked out, or none. */
  onMark: (span: Span | null) => void;
  /** A note picked on the waveform. */
  onPick: (id: string) => void;
  /** What's drawn right under the waveform: the meters. */
  meters?: ReactNode;
}
