'use client';

import { useRef } from 'react';
import { ClipRevealText } from '@/components/common/ClipRevealText';
import { SigilChip } from '@/components/common/SigilChip';
import { StarField } from '@/components/common/StarField';
import { WordReveal } from '@/components/common/WordReveal';
import { ArrowIcon, SigilIcon } from '@/components/icons';
import { useEntrance } from '@/hooks/useEntrance';
import GoldVortex from './GoldVortex';
import styles from './NotFoundPage.module.scss';
import type { NotFoundPageProps } from './NotFoundPage.types';

// The 404: the vortex in solid gold, turning in its galaxy of dust over
// the far stars, and under it what happened and the way back. One screen,
// no navbar: the two buttons are the way on.
export default function NotFoundPage({ copy }: NotFoundPageProps) {
  const rootRef = useRef<HTMLElement | null>(null);
  useEntrance(rootRef, { delay: 1.1, stagger: 0.1 });

  return (
    <main ref={rootRef} className={styles.page}>
      <title>{copy.title}</title>
      <StarField className={styles.stars} twinkle />
      <GoldVortex className={styles.scene} label={copy.alt} />
      <span className={styles.shade} aria-hidden="true" />

      <p className={styles.label} data-enter>
        <SigilIcon className={styles.labelGlyph} />
        {copy.label}
      </p>

      <div className={styles.content}>
        <h1 className={styles.headline}>
          <span className={styles.srOnly}>
            {copy.lead} {copy.statement}
          </span>
          <span className={styles.headlineVisual} aria-hidden="true">
            <WordReveal
              className={styles.lead}
              text={copy.lead}
              trigger="mount"
              startDelay={0.8}
              staggerDelay={0.08}
            />
            <ClipRevealText
              className={styles.statement}
              text={copy.statement}
              trigger="mount"
              startDelay={1.1}
            />
          </span>
        </h1>
        <WordReveal
          as="p"
          className={styles.body}
          text={copy.body}
          trigger="mount"
          startDelay={1.5}
          staggerDelay={0.02}
        />
        <div className={styles.actions} data-enter>
          <SigilChip variant="solid" icon={<ArrowIcon />} href="/">
            {copy.home}
          </SigilChip>
          <SigilChip variant="outline" icon={<ArrowIcon />} href="/discography">
            {copy.discography}
          </SigilChip>
        </div>
      </div>
    </main>
  );
}
