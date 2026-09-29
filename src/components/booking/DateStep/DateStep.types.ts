import type { BookingContent } from '@/content/booking/booking';
import type { Service } from '@/content/sessions/services';
import type { DateKey } from '@/lib/booking/dates';

export interface DateStepProps {
  copy: BookingContent['date'];
  summaryCopy: BookingContent['summary'];
  service: Service;
  date: DateKey | null;
  time: string | null;
  /** Today in the sessions' time zone. */
  today: DateKey;
  timeZoneLabel: string;
  price: string;
  onDate: (date: DateKey) => void;
  onTime: (time: string) => void;
  onBack: () => void;
  onNext: () => void;
}
