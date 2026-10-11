import type { ConsultCopy } from '@/content/consult/consult';

export interface NameGateProps {
  copy: ConsultCopy['gate'];
  /** The page's own label, over everything: "Feedback". */
  label: string;
  title: string;
  /** What Candy asked, if he wrote anything. */
  message: string;
  fromLabel: string;
  /** "Open for 3 days", already worded. */
  left: string;
  onStart: (name: string) => void;
}
