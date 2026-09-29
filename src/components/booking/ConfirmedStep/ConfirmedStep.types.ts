import type { BookingContent } from '@/content/booking/booking';
import type { Service } from '@/content/sessions/services';
import type { BookingConfirmation } from '@/lib/booking/bookingState';

export interface ConfirmedStepProps {
  copy: BookingContent['confirmation'];
  service: Service;
  confirmation: BookingConfirmation;
  timeZone: string;
  timeZoneLabel: string;
  price: string;
}
