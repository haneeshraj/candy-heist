'use client';

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef
} from 'react';
import { gsap, EASE_SIGNATURE } from '@/lib/animation/gsap';
import { useInView } from '@/hooks/useInView';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { groupWords } from '@/lib/text/groupWords';
import styles from './ClipRevealText.module.scss';
import type {
  ClipRevealTextHandle,
  ClipRevealTextProps
} from './ClipRevealText.types';

// The wipe sweeps through three states: collapsed at the left edge (nothing
// visible yet), a full solid rectangle (fully covering the text), then
// collapsed at the right edge (fully revealed). Animating in from CLIP_START
// rather than popping straight in at CLIP_FULL avoids a flash of solid color
// on first paint, before the timeline has had a chance to run.
const CLIP_START = 'polygon(0% 0%, 0% 0%, 0% 100%, 0% 100%)';
const CLIP_FULL = 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)';
const CLIP_END = 'polygon(100% 0%, 100% 0%, 100% 100%, 100% 100%)';

const ClipRevealText = forwardRef<ClipRevealTextHandle, ClipRevealTextProps>(
  function ClipRevealText(
    {
      text,
      as: Tag = 'span',
      className,
      letterClassName,
      trigger = 'mount',
      startDelay = 0,
      staggerDelay = 0.05,
      letterDuration = 0.6,
      ease = EASE_SIGNATURE,
      wipeColor = 'var(--color-cream)',
      respectReducedMotion = true,
      inViewOptions,
      onStart,
      onComplete
    },
    forwardedRef
  ) {
    const letters = useMemo(() => Array.from(text), [text]);
    const groups = useMemo(() => groupWords(letters), [letters]);
    const nodesRef = useRef<Array<HTMLSpanElement | null>>([]);
    // Tracks which node each index was last *primed* for — see the identical
    // ref in ScrambleText for why this can't just compare against the
    // previous nodesRef value (React calls a changed-identity callback ref
    // with null before reattaching the same node, on every render here since
    // this ref callback is inline).
    const primedNodesRef = useRef<Array<HTMLSpanElement | null>>([]);
    const wipeRef = useRef<HTMLSpanElement | null>(null);
    const timelineRef = useRef<gsap.core.Timeline | null>(null);
    const hasPlayedRef = useRef(false);
    const reducedMotion = useReducedMotion();
    const { ref: inViewRef, inView } = useInView<HTMLElement>(inViewOptions);

    const totalDuration = useMemo(
      () => Math.max(0, letters.length - 1) * staggerDelay + letterDuration,
      [letters.length, staggerDelay, letterDuration]
    );

    const skipMotion = reducedMotion && respectReducedMotion;

    const showFinal = useCallback(() => {
      nodesRef.current.forEach(
        (node) => node && gsap.set(node, { yPercent: 0 })
      );
      if (wipeRef.current) gsap.set(wipeRef.current, { clipPath: CLIP_END });
    }, []);

    // Adds the whole reveal to `tl`, starting at its 0.
    const build = useCallback(
      (tl: gsap.core.Timeline) => {
        // The wipe-in (CLIP_START -> CLIP_FULL) reuses letterDuration as a
        // single "beat" so it stays proportional to the rest of the reveal
        // without a dedicated prop. Everything else — the wipe-out and the
        // letters — is shifted to start once that beat finishes, so the
        // letters only animate during the mid-to-end (wipe-out) half.
        const wipeInDuration = letterDuration;

        if (wipeRef.current) {
          tl.to(
            wipeRef.current,
            { clipPath: CLIP_FULL, duration: wipeInDuration, ease },
            0
          );
          tl.to(
            wipeRef.current,
            { clipPath: CLIP_END, duration: totalDuration, ease },
            wipeInDuration
          );
        }

        letters.forEach((char, i) => {
          if (char === ' ') return;
          const node = nodesRef.current[i];
          if (node)
            tl.to(
              node,
              { yPercent: 0, duration: letterDuration, ease },
              wipeInDuration + i * staggerDelay
            );
        });

        return tl;
      },
      [letters, staggerDelay, letterDuration, ease, totalDuration]
    );

    const play = useCallback(() => {
      return new Promise<void>((resolve) => {
        timelineRef.current?.kill();

        if (skipMotion) {
          showFinal();
          onStart?.();
          onComplete?.();
          resolve();
          return;
        }

        onStart?.();

        timelineRef.current = build(
          gsap.timeline({
            delay: startDelay,
            onComplete: () => {
              onComplete?.();
              resolve();
            }
          })
        );
      });
    }, [skipMotion, showFinal, build, startDelay, onStart, onComplete]);

    const timeline = useCallback(() => {
      if (skipMotion) {
        showFinal();
        return gsap.timeline();
      }
      return build(gsap.timeline());
    }, [skipMotion, showFinal, build]);

    const reset = useCallback(() => {
      timelineRef.current?.kill();
      nodesRef.current.forEach(
        (node) => node && gsap.set(node, { y: 0, yPercent: -100 })
      );
      if (wipeRef.current) gsap.set(wipeRef.current, { clipPath: CLIP_START });
    }, []);

    useImperativeHandle(forwardedRef, () => ({ play, reset, timeline }), [
      play,
      reset,
      timeline
    ]);

    useEffect(() => {
      if (hasPlayedRef.current) return;
      if (trigger === 'mount') {
        hasPlayedRef.current = true;
        void play();
      } else if (trigger === 'inView' && inView) {
        hasPlayedRef.current = true;
        void play();
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [trigger, inView]);

    return (
      <Tag
        ref={inViewRef}
        className={
          className ? `${styles.wrapper} ${className}` : styles.wrapper
        }
        aria-label={text}
      >
        {groups.map((group) =>
          group.kind === 'space' ? (
            <span key={group.index} aria-hidden="true" className={styles.space}>
              {' '}
            </span>
          ) : (
            // One unbreakable span per word, so lines only break at spaces.
            <span key={group.start} aria-hidden="true" className={styles.word}>
              {group.chars.map((char, offset) => {
                const i = group.start + offset;
                return (
                  <span key={i} className={styles.mask}>
                    <span
                      ref={(node) => {
                        nodesRef.current[i] = node;
                        // Only prime a genuinely new DOM node: see
                        // primedNodesRef above for why, and ScrambleText's
                        // registerLetter for why priming is needed at all.
                        if (node && primedNodesRef.current[i] !== node) {
                          gsap.set(node, { y: 0, yPercent: -100 });
                          primedNodesRef.current[i] = node;
                        }
                      }}
                      className={`${styles.letter}${letterClassName ? ` ${letterClassName}` : ''}`}
                    >
                      {char}
                    </span>
                  </span>
                );
              })}
            </span>
          )
        )}
        <span
          ref={wipeRef}
          aria-hidden="true"
          className={styles.wipe}
          style={{ backgroundColor: wipeColor, clipPath: CLIP_START }}
        />
      </Tag>
    );
  }
);

export default ClipRevealText;
