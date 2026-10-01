import type { ServiceItem } from '@/content/services/catalogue';
import type { FlowContent } from '@/content/services/flows';
import type { BookingConfirmation, FlowKind } from '@/lib/booking/bookingState';

export interface ConfirmedStepProps {
  kind: FlowKind;
  copy: FlowContent['confirmation'];
  item: ServiceItem;
  confirmation: BookingConfirmation;
  timeZone: string;
  /** What was paid: the item's price, or the placeholder. */
  price: string;
  /** Candy's own email and Discord, for questions. */
  contact: { email: string; discord: string };
}
