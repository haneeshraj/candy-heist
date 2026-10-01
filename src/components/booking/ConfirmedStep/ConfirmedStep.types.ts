import type { ServiceItem } from '@/content/services/catalogue';
import type { FlowCopy } from '@/content/services/flows';
import type { BookingConfirmation } from '@/lib/booking/bookingState';
import type { Amounts } from '@/lib/booking/price';

export interface ConfirmedStepProps {
  copy: FlowCopy['confirmation'];
  item: ServiceItem;
  confirmation: BookingConfirmation;
  timeZone: string;
  /** What it cost, what was paid and what's left, or the placeholder. */
  amounts: Amounts;
  /** Candy's own email and Discord, for questions. */
  contact: { email: string; discord: string };
}
