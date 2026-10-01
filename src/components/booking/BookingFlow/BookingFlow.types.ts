import type { ServiceItem } from '@/content/services/catalogue';
import type { ProducerFlowContent } from '@/content/services/flows';

export interface BookingFlowProps {
  content: ProducerFlowContent;
  /** Every item, commissions and 1-1 sessions together. */
  items: ServiceItem[];
  /** Candy's own email and Discord, for questions after booking. */
  contact: { email: string; discord: string };
}
