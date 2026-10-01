import type { StepperStep } from '@/lib/booking/bookingState';

export interface BookingStepperProps {
  /** The flow's steps, in order. */
  steps: readonly StepperStep[];
  labels: Partial<Record<StepperStep, string>>;
  current: StepperStep;
  /** Called with a finished step when it's clicked. */
  onJump: (step: StepperStep) => void;
  /** Accessible name for the nav. */
  label: string;
}
