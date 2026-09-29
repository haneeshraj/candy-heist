import type { BookingContent } from '@/content/booking/booking';
import type { Service } from '@/content/sessions/services';

export interface IntroStepProps {
  content: BookingContent;
  services: Service[];
  selectedId: string | null;
  onSelect: (serviceId: string) => void;
  /** Continues to the chosen session's details. */
  onNext: () => void;
}

export interface SessionCardProps {
  service: Service;
  /** Radio group name, shared by the cards. */
  name: string;
  selected: boolean;
  onSelect: (serviceId: string) => void;
}
