'use client';

import { useEffect, useImperativeHandle, useRef } from 'react';
import { TRAP_FIELD, type FormCheck } from '@/lib/forms/spam';
import styles from './FormTrap.module.scss';
import type { FormTrapHandle, FormTrapProps } from './FormTrap.types';

// The quiet half of a form's spam checks: a field nobody sees, which bots
// fill in, and the moment the form was opened, which a bot sending at once
// gives away. Neither is ever shown, focused or read out.
export default function FormTrap({ ref }: FormTrapProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const openedAt = useRef(0);

  // On the visitor's clock, after the page is theirs: a time from the
  // server's render would count the page's load as typing.
  useEffect(() => {
    openedAt.current = Date.now();
  }, []);

  useImperativeHandle(
    ref,
    (): FormTrapHandle => ({
      check: (): FormCheck => ({
        trap: inputRef.current?.value ?? '',
        startedAt: openedAt.current
      })
    }),
    []
  );

  return (
    <div className={styles.trap} aria-hidden="true">
      <label>
        Website
        <input
          ref={inputRef}
          type="text"
          name={TRAP_FIELD}
          tabIndex={-1}
          autoComplete="off"
          defaultValue=""
        />
      </label>
    </div>
  );
}
