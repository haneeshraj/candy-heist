export interface SliderProps {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  /** What the value reads as: "+4 dB", "1.5 kHz", "60%". */
  format: (value: number) => string;
  onChange: (value: number) => void;
}
