import type { BookingContent } from '@/content/booking/booking';
import type { Service } from '@/content/sessions/services';

export interface SessionStepProps {
  copy: BookingContent['session'];
  services: Service[];
  selectedId: string;
  onSelect: (serviceId: string) => void;
  /** Continues to the calendar with the selected session. */
  onBook: () => void;
}

export interface SessionOptionProps {
  service: Service;
  name: string;
  selected: boolean;
  onSelect: (serviceId: string) => void;
}

export interface SessionDetailProps {
  copy: BookingContent['session'];
  service: Service;
}
