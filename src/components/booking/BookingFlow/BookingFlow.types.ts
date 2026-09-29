import type { BookingContent } from '@/content/booking/booking';
import type { Service } from '@/content/sessions/services';

export interface BookingFlowProps {
  content: BookingContent;
  services: Service[];
}
