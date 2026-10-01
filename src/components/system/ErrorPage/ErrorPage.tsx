'use client';

import { useRef } from 'react';
import { ClipRevealText } from '@/components/common/ClipRevealText';
import { Rings } from '@/components/common/Rings';
import { SigilChip } from '@/components/common/SigilChip';
import { WordReveal } from '@/components/common/WordReveal';
import { ArrowIcon, SigilIcon } from '@/components/icons';
import { useEntrance } from '@/hooks/useEntrance';
import { fill } from '@/lib/text/fill';
import styles from './ErrorPage.module.scss';
import type { ErrorPageProps } from './ErrorPage.types';

// When something breaks: the broadcast's rings, its red point flickering
// like a signal dropping out, and the two ways on: try again, or home.
// The reference matches the error in the server's logs, for anyone who
// writes in about it.
export default function ErrorPage({ copy, digest, onRetry }: ErrorPageProps) {
  const rootRef = useRef<HTMLElement | null>(null);
  useEntrance(rootRef, { delay: 0.6, stagger: 0.1 });

  return (
    <section
      ref={rootRef}
      className={styles.page}
      aria-labelledby="error-heading"
    >
      <title>{copy.title}</title>
      <div className={styles.content}>
        {/* The point the rings spread from, over the words. */}
        <div className={styles.field} aria-hidden="true">
          <Rings className={styles.rings} />
          <span className={styles.halo} />
          <span className={styles.point} />
        </div>
        <p className={styles.label} data-enter>
          <SigilIcon className={styles.labelGlyph} />
          {copy.label}
        </p>
        <h1 id="error-heading" className={styles.headline}>
          <span className={styles.srOnly}>
            {copy.lead} {copy.statement}
          </span>
          <span className={styles.headlineVisual} aria-hidden="true">
            <WordReveal
              className={styles.lead}
              text={copy.lead}
              trigger="mount"
              staggerDelay={0.08}
            />
            <ClipRevealText
              className={styles.statement}
              text={copy.statement}
              trigger="mount"
              startDelay={0.3}
            />
          </span>
        </h1>
        <WordReveal
          as="p"
          className={styles.body}
          text={copy.body}
          trigger="mount"
          startDelay={0.6}
          staggerDelay={0.02}
        />
        <div className={styles.actions} data-enter>
          <SigilChip variant="solid" icon={<ArrowIcon />} onClick={onRetry}>
            {copy.retry}
          </SigilChip>
          <SigilChip variant="outline" icon={<ArrowIcon />} href="/">
            {copy.home}
          </SigilChip>
        </div>
        {digest ? (
          <p className={styles.reference} data-enter>
            {fill(copy.reference, { digest })}
          </p>
        ) : null}
      </div>
    </section>
  );
}
