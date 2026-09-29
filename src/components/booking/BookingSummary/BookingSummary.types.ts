import type { BookingContent } from '@/content/booking/booking';
import type { Service } from '@/content/sessions/services';
import type { DateKey } from '@/lib/booking/dates';

export interface BookingSummaryProps {
  copy: BookingContent['summary'];
  service: Service;
  date: DateKey | null;
  time: string | null;
  timeZoneLabel: string;
  price: string;
}
