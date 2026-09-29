import type { BookingContent } from '@/content/booking/booking';
import type { Service } from '@/content/sessions/services';
import type { DateKey } from '@/lib/booking/dates';

export interface PaymentStepProps {
  copy: BookingContent['payment'];
  summaryCopy: BookingContent['summary'];
  service: Service;
  date: DateKey | null;
  time: string | null;
  timeZoneLabel: string;
  price: string;
  /** True while the booking is being finalised. */
  paying: boolean;
  onPay: () => void;
  onBack: () => void;
}
