'use client';

import { useLenis } from 'lenis/react';
import { useId, useRef, type MouseEvent } from 'react';
import { ClipRevealText } from '@/components/common/ClipRevealText';
import { ScrambleText } from '@/components/common/ScrambleText';
import { SigilChip } from '@/components/common/SigilChip';
import { VideoPlayer } from '@/components/common/VideoPlayer';
import { WordReveal } from '@/components/common/WordReveal';
import { ArrowIcon, SigilIcon } from '@/components/icons';
import { useEntrance } from '@/hooks/useEntrance';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import StepHeading from '../StepHeading/StepHeading';
import styles from './IntroStep.module.scss';
import type { IntroStepProps } from './IntroStep.types';
import NextBar from './NextBar';
import SessionCard from './SessionCard';

// The page's opening (Figma "D1 · 1 Intro and sessions"): the intro video,
// who Candy Heist is, then the four sessions. Picking one brings in the
// Next bar, which continues to that session's details.
export default function IntroStep({
  content,
  services,
  selectedId,
  onSelect,
  onNext
}: IntroStepProps) {
  const rootRef = useRef<HTMLElement | null>(null);
  const chooseRef = useRef<HTMLDivElement | null>(null);
  const groupName = useId();
  const chooseId = useId();
  const lenis = useLenis();
  useEntrance(rootRef);
  useScrollReveal(rootRef);

  const { intro, choose } = content;
  const selected = services.find((service) => service.id === selectedId);

  function jumpToChoose(event: MouseEvent<HTMLAnchorElement>) {
    const target = chooseRef.current;
    if (!target) return;
    event.preventDefault();
    if (lenis) lenis.scrollTo(target, { offset: -48 });
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
          src={intro.video.src}
          poster={intro.video.poster}
          posterAlt={intro.video.posterAlt}
          eyebrow={intro.video.eyebrow}
          title={intro.video.title}
          duration={intro.video.duration}
          chapters={intro.video.chapters}
          unavailableLabel={intro.video.unavailable}
          priority
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
              <ScrambleText
                className={styles.statement}
                text={intro.statement}
                trigger="inView"
                startDelay={0.3}
                scrambleEnabled={false}
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
              className={styles.jump}
              href={`#${chooseId}`}
              onClick={jumpToChoose}
            >
              <span className={styles.srOnly}>{intro.jump}</span>
              <span aria-hidden="true">
                <ClipRevealText
                  text={`${intro.jump} ↓`}
                  trigger="inView"
                  startDelay={0.9}
                  wipeColor="var(--color-gilt)"
                />
              </span>
            </a>
          </div>
        </div>

        <div className={styles.divider} data-reveal aria-hidden="true">
          <span className={styles.dividerLine} />
          <SigilIcon className={styles.dividerSigil} />
          <span className={styles.dividerLine} />
        </div>

        <div ref={chooseRef} id={chooseId} className={styles.choose}>
          <StepHeading
            label={choose.label}
            heading={choose.heading}
            sub={choose.sub}
            trigger="inView"
          />

          <div
            className={styles.cards}
            role="radiogroup"
            aria-label={choose.heading}
          >
            {services.map((service) => (
              <SessionCard
                key={service.id}
                service={service}
                name={groupName}
                selected={service.id === selectedId}
                onSelect={onSelect}
              />
            ))}
          </div>

          <div className={styles.nextSlot} aria-live="polite">
            {selected ? (
              <NextBar
                key="ready"
                label={`${choose.selected} · ${selected.name}`}
              >
                <SigilChip
                  variant="solid"
                  icon={<ArrowIcon />}
                  onClick={onNext}
                >
                  {choose.next}
                </SigilChip>
              </NextBar>
            ) : (
              <p className={styles.prompt}>{choose.prompt}</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
