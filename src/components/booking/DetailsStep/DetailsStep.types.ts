import type { FlowContent } from '@/content/services/flows';
import type { BookingDetails, MeetOn } from '@/lib/booking/bookingState';
import type { SummaryProps } from '../types';

export interface DetailsStepProps {
  copy: FlowContent['details'];
  summary: SummaryProps;
  details: BookingDetails;
  /** Every edit, so the draft survives going back and forth. */
  onChange: (details: BookingDetails) => void;
  /** Called with valid details only. */
  onSubmit: (details: BookingDetails) => void;
  onBack: () => void;
}

export interface MeetOnSwitchProps {
  copy: NonNullable<FlowContent['details']['meetOn']>;
  value: MeetOn;
  onChange: (value: MeetOn) => void;
}
