import type { ServiceItem } from '@/content/services/catalogue';
import type { FlowContent } from '@/content/services/flows';
import type { FlowKind } from '@/lib/booking/bookingState';

export interface BookingFlowProps {
  kind: FlowKind;
  content: FlowContent;
  items: ServiceItem[];
  /** Candy's own email and Discord, for questions after booking. */
  contact: { email: string; discord: string };
}
