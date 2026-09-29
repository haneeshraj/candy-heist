import type { StepperStep } from '@/lib/booking/bookingState';

export interface BookingStepperProps {
  labels: Record<StepperStep, string>;
  current: StepperStep;
  /** Called with a finished step when it's clicked. */
  onJump: (step: StepperStep) => void;
  /** Accessible name for the nav. */
  label: string;
}
