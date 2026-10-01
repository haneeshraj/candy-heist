'use client';

import { useLenis } from 'lenis/react';
import { useId, useMemo, useRef, type MouseEvent } from 'react';
import { ClipRevealText } from '@/components/common/ClipRevealText';
import { VideoPlayer } from '@/components/common/VideoPlayer';
import { WordReveal } from '@/components/common/WordReveal';
import { SigilIcon } from '@/components/icons';
import { useEntrance } from '@/hooks/useEntrance';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { browseItems } from '@/lib/services/browse';
import StepHeading from '../StepHeading/StepHeading';
import BrowseBar from './BrowseBar';
import styles from './IntroStep.module.scss';
import type { IntroStepProps } from './IntroStep.types';
import ServiceCards from './ServiceCards';

// The flow's opening (Figma "Producer · 1 · Intro and items"): the intro
// video, the headline, then every service as a card that opens its
// details, each tagged a commission or a 1-1 session. Over the cards,
// Filter & sort and the search narrow them down. The cards rise in a few
// at a time as they scroll into view.
export default function IntroStep({
  content,
  items,
  browse,
  onBrowse,
  onOpen
}: IntroStepProps) {
  const rootRef = useRef<HTMLElement | null>(null);
  const chooseId = useId();
  const lenis = useLenis();
  useEntrance(rootRef);
  useScrollReveal(rootRef);

  const { intro, choose, kinds } = content;
  const { video } = intro;
  const labels = useMemo(
    () => ({ commission: kinds.commission.tag, session: kinds.session.tag }),
    [kinds]
  );
  const found = useMemo(
    () => browseItems(items, browse, labels),
    [items, browse, labels]
  );

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
      aria-label={intro.statement}
    >
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
                trigger="inView"
                staggerDelay={0.08}
              />
              <ClipRevealText
                className={styles.statement}
                text={intro.statement}
                trigger="inView"
                startDelay={0.3}
              />
            </span>
          </h2>
          <div className={styles.heroAside}>
            <WordReveal
              as="p"
              className={styles.body}
              text={intro.body}
              trigger="inView"
              startDelay={0.5}
              staggerDelay={0.02}
            />
            <a
              className={styles.cue}
              href={`#${chooseId}`}
              onClick={toChoose}
              data-reveal
            >
              {intro.cue}
              <span aria-hidden="true"> ↓</span>
            </a>
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

          <BrowseBar
            copy={content.browse}
            kinds={kinds}
            items={items}
            browse={browse}
            shown={found.length}
            onBrowse={onBrowse}
          />

          {found.length > 0 ? (
            <ServiceCards
              key={found.map((item) => item.id).join(',')}
              items={found}
              kinds={kinds}
              price={content.price}
              view={choose.view}
              onOpen={onOpen}
            />
          ) : (
            <p className={styles.empty} aria-live="polite">
              {content.browse.filters.empty}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
