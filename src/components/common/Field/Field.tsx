import type { InputHTMLAttributes, TextareaHTMLAttributes } from 'react';
import styles from './Field.module.scss';
import type { FieldProps } from './Field.types';

// A labelled input or textarea (Figma "Booking / Field"): a mono label over
// an obsidian box that turns gilt on focus. The error sits under the box and
// is wired to the control, so it's read out with it.
export default function Field(props: FieldProps) {
  const {
    id,
    label,
    required,
    optionalLabel,
    error,
    className,
    multiline,
    ...native
  } = props;
  const errorId = `${id}-error`;

  const shared = {
    id,
    'aria-required': required || undefined,
    'aria-invalid': error ? true : undefined,
    'aria-describedby': error ? errorId : undefined
  };

  return (
    <div
      className={className ? `${styles.field} ${className}` : styles.field}
      data-invalid={error ? 'true' : undefined}
    >
      <label className={styles.label} htmlFor={id}>
        {label}
        {required ? (
          <span className={styles.star} aria-hidden="true">
            {' '}
            *
          </span>
        ) : null}
        {optionalLabel ? (
          <span className={styles.optional}> ({optionalLabel})</span>
        ) : null}
      </label>

      {multiline ? (
        <textarea
          {...(native as TextareaHTMLAttributes<HTMLTextAreaElement>)}
          {...shared}
          className={`${styles.control} ${styles.area}`}
        />
      ) : (
        <input
          {...(native as InputHTMLAttributes<HTMLInputElement>)}
          {...shared}
          className={styles.control}
        />
      )}

      {error ? (
        <p id={errorId} className={styles.error}>
          {error}
        </p>
      ) : null}
    </div>
  );
}
