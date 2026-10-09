import type { ProducerFlowContent } from '@/content/services/flows';
import type { Hours } from '@/lib/booking/hours';
import type { ServiceItem } from '@/lib/services/model';

export interface BookingFlowProps {
  content: ProducerFlowContent;
  /** Every item, commissions and 1-1 sessions together. */
  items: ServiceItem[];
  /** When sessions can be booked: how far ahead the calendar goes. */
  hours: Hours;
  /** Candy's own email and Discord, for questions after booking. */
  contact: { email: string; discord: string };
}
