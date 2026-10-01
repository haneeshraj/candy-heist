'use client';

import { useLenis } from 'lenis/react';
import { useId, useRef, type MouseEvent } from 'react';
import { ClipRevealText } from '@/components/common/ClipRevealText';
import { VideoPlayer } from '@/components/common/VideoPlayer';
import { WordReveal } from '@/components/common/WordReveal';
import { SigilIcon } from '@/components/icons';
import { useEntrance } from '@/hooks/useEntrance';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import StepHeading from '../StepHeading/StepHeading';
import ItemCard from './ItemCard';
import styles from './IntroStep.module.scss';
import type { IntroStepProps } from './IntroStep.types';

// A flow's opening (Figma "1 · Intro and sessions / commissions"): for
// sessions the intro video, then who Candy Heist is; for commissions just
// the headline. Then every item as a card that opens its details. The
// cards rise in a few at a time as they scroll into view.
export default function IntroStep({
  kind,
  content,
  items,
  price,
  onOpen
}: IntroStepProps) {
  const rootRef = useRef<HTMLElement | null>(null);
  const chooseId = useId();
  const lenis = useLenis();
  useEntrance(rootRef);
  useScrollReveal(rootRef);

  const { intro, choose } = content;
  const { video } = intro;
  // A short list (the two sessions) gets wide cards.
  const few = items.length <= 2;

  function toChoose(event: MouseEvent<HTMLAnchorElement>) {
    const target = document.getElementById(chooseId);
    if (!target) return;
    event.preventDefault();
    if (lenis) lenis.scrollTo(target, { offset: -32 });
    else target.scrollIntoView({ behavior: 'smooth' });
  }

  return (
    <section
      ref={rootRef}
      className={styles.intro}
      data-bare={video ? undefined : 'true'}
      aria-label={intro.statement}
    >
      {video ? (
        <div className={styles.player} data-enter>
          <VideoPlayer
            src={video.src}
            poster={video.poster}
            posterAlt={video.posterAlt}
            eyebrow={video.eyebrow}
            title={video.title}
            duration={video.duration}
            chapters={video.chapters}
            unavailableLabel={video.unavailable}
            // Covers the screen: as wide as the viewport, or 16:9 of its height.
            sizes="(min-aspect-ratio: 16/9) 100vw, 178vh"
            priority
            fill
          />
        </div>
      ) : null}

      <div className={styles.column}>
        <div className={styles.hero}>
          <h2 className={styles.headline}>
            <span className={styles.srOnly}>
              {intro.lead} {intro.statement}
            </span>
            <span className={styles.headlineVisual} aria-hidden="true">
              <WordReveal
                className={styles.lead}
                text={intro.lead}
                trigger={video ? 'inView' : 'mount'}
                staggerDelay={0.08}
              />
              <ClipRevealText
                className={styles.statement}
                text={intro.statement}
                trigger={video ? 'inView' : 'mount'}
                startDelay={0.3}
              />
            </span>
          </h2>
          <div className={styles.heroAside}>
            <WordReveal
              as="p"
              className={styles.body}
              text={intro.body}
              trigger={video ? 'inView' : 'mount'}
              startDelay={0.5}
              staggerDelay={0.02}
            />
            {intro.cue ? (
              <a
                className={styles.cue}
                href={`#${chooseId}`}
                onClick={toChoose}
                data-reveal
              >
                {intro.cue}
                <span aria-hidden="true"> ↓</span>
              </a>
            ) : null}
          </div>
        </div>

        <div className={styles.divider} data-reveal aria-hidden="true">
          <span className={styles.dividerLine} />
          <SigilIcon className={styles.dividerSigil} />
          <span className={styles.dividerLine} />
        </div>

        <div id={chooseId} className={styles.choose}>
          <StepHeading
            label={choose.label}
            heading={choose.heading}
            sub={choose.sub}
            trigger="inView"
          />

          <div className={styles.cards} data-few={few ? 'true' : undefined}>
            {items.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                href={`?step=${kind}&${kind}=${item.id}`}
                price={item.price ?? price}
                view={choose.view}
                onOpen={onOpen}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
