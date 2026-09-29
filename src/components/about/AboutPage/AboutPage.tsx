'use client';

import { useId, useRef } from 'react';
import { useScrollRefresh } from '@/hooks/useScrollRefresh';
import { AboutBanner } from '../AboutBanner';
import { AboutContinues } from '../AboutContinues';
import { AboutJourney } from '../AboutJourney';
import { useReveals } from '../reveals';
import styles from './AboutPage.module.scss';
import type { AboutPageProps } from './AboutPage.types';

// Figma "ABOUT PAGE — storyboard": the journey (intro, who is, Nayara,
// behind the signal) and then the signal continues. The banner the
// journey ends in belongs to the page: it pins to the top from there on,
// above both, and settles as the last section scrolls in under it. The
// whole page is scroll-driven, so its triggers re-measure whenever its
// height shifts (fonts, images, reflowing copy).
export default function AboutPage({ content }: AboutPageProps) {
  const headingId = useId();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const bannerRef = useRef<HTMLDivElement | null>(null);
  const { bind, reveals } = useReveals();
  useScrollRefresh(rootRef);

  return (
    <div ref={rootRef} className={styles.about}>
      <div ref={bannerRef} className={styles.bannerSlot}>
        <AboutBanner
          name={content.continues.banner.name}
          photo={content.continues.banner.photo}
        />
      </div>
      <AboutJourney
        content={content}
        headingId={headingId}
        bind={bind}
        reveals={reveals}
        bannerRef={bannerRef}
      />
      <AboutContinues
        content={content}
        bind={bind}
        reveals={reveals}
        bannerRef={bannerRef}
      />
    </div>
  );
}
