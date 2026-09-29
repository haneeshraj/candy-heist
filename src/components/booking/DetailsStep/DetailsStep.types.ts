import type { BookingContent } from '@/content/booking/booking';
import type { Service } from '@/content/sessions/services';
import type { BookingDetails } from '@/lib/booking/bookingState';
import type { DateKey } from '@/lib/booking/dates';

export interface DetailsStepProps {
  copy: BookingContent['details'];
  summaryCopy: BookingContent['summary'];
  service: Service;
  date: DateKey | null;
  time: string | null;
  details: BookingDetails;
  timeZoneLabel: string;
  price: string;
  /** Every edit, so the draft survives going back and forth. */
  onChange: (details: BookingDetails) => void;
  /** Called with valid details only. */
  onSubmit: (details: BookingDetails) => void;
  onBack: () => void;
}
