import type { RefObject } from 'react';
import type { ConsultCopy } from '@/content/consult/consult';
import type { Meters } from '@/lib/consult/audio';

export interface TrackMetersProps {
  copy: ConsultCopy['room']['meters'];
  /** The meters on what's heard; null until the first play. */
  metersRef: RefObject<Meters | null>;
  playing: boolean;
}
