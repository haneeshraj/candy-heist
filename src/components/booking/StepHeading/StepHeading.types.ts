export interface StepHeadingProps {
  label: string;
  heading: string;
  sub?: string;
  /** Id for the heading, so the step's region can be named by it. */
  id?: string;
  /** 'inView' for a heading that starts below the fold. @default 'mount' */
  trigger?: 'mount' | 'inView';
  /** Seconds before the label starts. @default 0 */
  delay?: number;
}
