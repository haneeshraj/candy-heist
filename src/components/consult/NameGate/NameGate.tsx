'use client';

import { useId, useState, type FormEvent } from 'react';
import { Field } from '@/components/common/Field';
import { MAX_NAME } from '@/lib/consult/engine';
import styles from './NameGate.module.scss';
import type { NameGateProps } from './NameGate.types';

// The way into a feedback link: what the track is, what Candy asked, how
// long the link stays open, and the producer's name, so Candy knows whose
// notes are whose. No account, no email: a name is all it asks.
export default function NameGate({
  copy,
  label,
  title,
  message,
  fromLabel,
  left,
  onStart
}: NameGateProps) {
  const id = useId();
  const [name, setName] = useState('');
  const trimmed = name.trim();

  function start(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (trimmed) onStart(trimmed);
  }

  return (
    <form
      className={styles.gate}
      onSubmit={start}
      aria-labelledby={`${id}-title`}
    >
      <p className={styles.label}>{label}</p>
      <p className={styles.lead}>{copy.lead}</p>
      <h1 id={`${id}-title`} className={styles.title}>
        {title}
      </h1>
      <p className={styles.left}>{left}</p>
      {message ? (
        <blockquote className={styles.message}>
          <span className={styles.from}>{fromLabel}</span>
          {message}
        </blockquote>
      ) : null}
      <Field
        id={`${id}-name`}
        label={copy.name.label}
        placeholder={copy.name.placeholder}
        autoComplete="name"
        maxLength={MAX_NAME}
        required
        value={name}
        onChange={(event) => setName(event.target.value)}
        className={styles.name}
      />
      <button type="submit" className={styles.start} disabled={!trimmed}>
        {copy.start}
      </button>
      <p className={styles.small}>{copy.private}</p>
      <p className={styles.small}>{copy.unreleased}</p>
    </form>
  );
}
