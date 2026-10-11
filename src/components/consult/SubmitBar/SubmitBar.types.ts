import type { ConsultCopy } from '@/content/consult/consult';

export interface SubmitBarProps {
  copy: ConsultCopy['submit'];
  /** Notes that would be sent: ones that say something or carry tools. */
  noteCount: number;
  /** Sets of tools that would be sent: each section's, and the whole song's. */
  toolCount: number;
  sending: boolean;
  onSend: () => void;
}
