import type { ProducerFlowContent } from '@/content/services/flows';
import type { DateKey } from '@/lib/booking/dates';
import type { SummaryProps } from '../types';

export interface DateStepProps {
  copy: ProducerFlowContent['date'];
  summary: SummaryProps;
  date: DateKey | null;
  time: string | null;
  /** Today in the sessions' time zone. */
  today: DateKey;
  onDate: (date: DateKey) => void;
  onTime: (time: string) => void;
  onBack: () => void;
  onNext: () => void;
}
