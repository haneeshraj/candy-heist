import type { ProducerFlowContent } from '@/content/services/flows';
import type { DateKey } from '@/lib/booking/dates';
import type { SummaryProps } from '../types';

export interface DateStepProps {
  copy: ProducerFlowContent['date'];
  summary: SummaryProps;
  /** The session whose times are shown. */
  itemId: string;
  /** The day picked, in the visitor's zone. */
  date: DateKey | null;
  /** The time picked, as the instant it starts (ISO). */
  start: string | null;
  /** Today in the visitor's zone. */
  today: DateKey;
  /** The visitor's zone: every time on the step is in it. */
  timeZone: string;
  onDate: (date: DateKey) => void;
  onStart: (start: string | null) => void;
  onBack: () => void;
  onNext: () => void;
}
