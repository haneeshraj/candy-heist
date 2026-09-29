'use client';

import type { ElementType } from 'react';
import { ClipRevealText } from '@/components/common/ClipRevealText';
import { SigilIcon } from '@/components/icons';
import type { RevealBinder } from '../reveals';
import styles from './AboutLabel.module.scss';

interface AboutLabelProps {
  text: string;
  /** The key its reveal registers under. */
  revealKey: string;
  bind: RevealBinder;
  /** @default 'p' */
  as?: ElementType;
  id?: string;
  className?: string;
}

// The section label on every About screen: the sigil, which turns into
// place, and the name, wiped in. The motion hooks drive both; the plain copy
// is what assistive tech reads.
export default function AboutLabel({
  text,
  revealKey,
  bind,
  as: Tag = 'p',
  id,
  className
}: AboutLabelProps) {
  return (
    <Tag
      id={id}
      className={className ? `${styles.label} ${className}` : styles.label}
      data-motion="label"
    >
      <span className={styles.sigil} data-motion="label-sigil">
        <SigilIcon />
      </span>
      <span className={styles.srOnly}>{text}</span>
      <span aria-hidden="true">
        <ClipRevealText
          ref={bind(revealKey)}
          text={text}
          trigger="manual"
          wipeColor="var(--color-gilt)"
        />
      </span>
    </Tag>
  );
}
