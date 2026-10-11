import type { RefObject } from 'react';
import type { ConsultCopy } from '@/content/consult/consult';
import type { EqBand } from '@/lib/consult/engine';

export interface EqEditorProps {
  copy: ConsultCopy['tools']['eq'] & { remove: string };
  bands: EqBand[];
  /** The live reading drawn behind the curve; empty until the first play. */
  analyserRef: RefObject<AnalyserNode | null>;
  playing: boolean;
  onChange: (bands: EqBand[]) => void;
}
