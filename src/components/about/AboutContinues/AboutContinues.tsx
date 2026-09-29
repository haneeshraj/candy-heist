'use client';

import { useId, useRef } from 'react';
import { RichWordReveal } from '@/components/common/RichWordReveal';
import { SigilChip } from '@/components/common/SigilChip';
import { SocialLinks } from '@/components/common/SocialLinks';
import { WordReveal } from '@/components/common/WordReveal';
import { ArrowIcon } from '@/components/icons';
import { AboutBanner } from '../AboutBanner';
import { AboutLabel } from '../AboutLabel';
import { StarField } from '../StarField';
import styles from './AboutContinues.module.scss';
import type { AboutContinuesProps } from './AboutContinues.types';
import { useContinuesMotion } from './useContinuesMotion';

// Figma frames 5.1 to 5.3, "The signal continues". On desktop the journey
// ends by widening into the sticky banner (the page's), and this rises in
// under it: the headline pinned on the left, the paragraphs flowing up the
// right and dissolving as they pass under the banner, then the sign-off
// and the page's buttons. Phones get their own banner at the top.
export default function AboutContinues({
  content,
  bind,
  reveals,
  bannerRef
}: AboutContinuesProps) {
  const rootRef = useRef<HTMLElement | null>(null);
  const headingId = useId();
  useContinuesMotion(rootRef, reveals, bannerRef);

  const { continues } = content;

  return (
    <section
      ref={rootRef}
      className={styles.continues}
      aria-labelledby={headingId}
    >
      <StarField className={styles.stars} />
      <AboutBanner
        className={styles.banner}
        name={continues.banner.name}
        photo={continues.banner.photo}
      />

      <div className={styles.inner}>
        <div className={styles.grid}>
          <div className={styles.aside} data-motion="aside">
            <AboutLabel
              text={continues.label}
              revealKey="continues.label"
              bind={bind}
            />
            <h2 id={headingId} className={styles.headline}>
              <WordReveal
                ref={bind('continues.headline')}
                text={continues.headline}
                trigger="manual"
                staggerDelay={0.06}
              />
            </h2>
          </div>

          <div className={styles.flow} data-motion="flow">
            <WordReveal
              ref={bind('continues.lede')}
              as="p"
              className={styles.lede}
              text={continues.lede}
              trigger="manual"
              staggerDelay={0.02}
            />
            {continues.paragraphs.map((paragraph, i) => (
              <RichWordReveal
                key={i}
                ref={bind(`continues.p${i}`)}
                segments={paragraph}
                className={styles.paragraph}
                emphasisClassName={styles.emphasis}
                placeholderClassName={styles.placeholder}
                staggerDelay={0.012}
              />
            ))}
          </div>
        </div>

        <div className={styles.coda}>
          <WordReveal
            ref={bind('continues.closing')}
            as="p"
            className={styles.closing}
            text={continues.closing}
            trigger="manual"
            staggerDelay={0.06}
          />
          <div className={styles.codaRow} data-motion="coda-row">
            <SocialLinks
              links={content.streaming}
              label={content.who.streamingLabel}
              itemMotion="social"
            />
            <div className={styles.ctas}>
              <span className={styles.ctaWrap} data-motion="cta">
                <SigilChip href={continues.listen.href} icon={<ArrowIcon />}>
                  {continues.listen.label}
                </SigilChip>
              </span>
              <span className={styles.ctaWrap} data-motion="cta">
                <SigilChip
                  href={continues.contact.href}
                  variant="solid"
                  icon={<ArrowIcon />}
                >
                  {continues.contact.label}
                </SigilChip>
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
