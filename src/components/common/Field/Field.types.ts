import type { InputHTMLAttributes, TextareaHTMLAttributes } from 'react';

interface FieldOwnProps {
  /** Ties the label, the control and its error together. */
  id: string;
  label: string;
  /** Adds the gilt star and aria-required. */
  required?: boolean;
  /** Shown after the label for optional fields, e.g. "optional". */
  optionalLabel?: string;
  /** A message here marks the field invalid and is announced with it. */
  error?: string;
  className?: string;
}

export type FieldInputProps = FieldOwnProps &
  Omit<InputHTMLAttributes<HTMLInputElement>, 'id' | 'className'> & {
    multiline?: false;
  };

export type FieldAreaProps = FieldOwnProps &
  Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'id' | 'className'> & {
    /** Renders a textarea instead of an input. */
    multiline: true;
  };

export type FieldProps = FieldInputProps | FieldAreaProps;
