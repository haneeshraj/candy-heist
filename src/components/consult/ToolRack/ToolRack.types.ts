import type { RefObject } from 'react';
import type { ConsultCopy } from '@/content/consult/consult';
import type { Chain } from '@/lib/consult/engine';

/** What the tools can be put on: the whole song, or one section. */
export interface ToolTarget {
  /** `whole`, or the section's note id. */
  id: string;
  label: string;
}

export interface ToolRackProps {
  copy: ConsultCopy['tools'];
  /** The whole song first, then each section, in order. */
  targets: ToolTarget[];
  target: string;
  onTarget: (id: string) => void;
  /** The picked target's tools. */
  chain: Chain;
  analyserRef: RefObject<AnalyserNode | null>;
  playing: boolean;
  onChange: (chain: Chain) => void;
}
