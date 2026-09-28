'use client';

import {
  forwardRef,
  Fragment,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef
} from 'react';
import { gsap, EASE_SIGNATURE } from '@/lib/animation/gsap';
import { useInView } from '@/hooks/useInView';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import styles from './WordReveal.module.scss';
import type { WordRevealHandle, WordRevealProps } from './WordReveal.types';

// The per-letter reveals (ClipRevealText, ScrambleText) suit short lines of
// capitals. Running copy needs whole words: letter masks allow a line break
// between any two letters, and their overflow clip shaves italic overhangs.
// Here each word rises out of its own mask and lines only break at spaces.

// Hidden offset, in % of each word's height. It's past 100 because the masks
// reach a little below the line to keep descenders (see the stylesheet).
const HIDDEN_Y_PERCENT = 120;

const WordReveal = forwardRef<WordRevealHandle, WordRevealProps>(
  function WordReveal(
    {
      text,
      as: Tag = 'span',
      className,
      wordClassName,
      trigger = 'mount',
      startDelay = 0,
      staggerDelay = 0.04,
      wordDuration = 0.9,
      ease = EASE_SIGNATURE,
      respectReducedMotion = true,
      inViewOptions,
      onStart,
      onComplete
    },
    forwardedRef
  ) {
    const words = useMemo(() => text.split(/\s+/).filter(Boolean), [text]);
    const nodesRef = useRef<Array<HTMLSpanElement | null>>([]);
    // Same guard as ClipRevealText's: only prime a genuinely new node, since
    // the inline callback ref detaches (null) and reattaches on every render.
    const primedNodesRef = useRef<Array<HTMLSpanElement | null>>([]);
    const timelineRef = useRef<gsap.core.Timeline | null>(null);
    const hasPlayedRef = useRef(false);
    const reducedMotion = useReducedMotion();
    const { ref: inViewRef, inView } = useInView<HTMLElement>(inViewOptions);
    const skipMotion = reducedMotion && respectReducedMotion;

    const wordNodes = useCallback(
      () => nodesRef.current.slice(0, words.length),
      [words.length]
    );

    const showFinal = useCallback(() => {
      wordNodes().forEach((node) => node && gsap.set(node, { yPercent: 0 }));
    }, [wordNodes]);

    // Adds the whole reveal to `tl`, starting at its 0.
    const build = useCallback(
      (tl: gsap.core.Timeline) => {
        wordNodes().forEach((node, i) => {
          if (node)
            tl.to(
              node,
              { yPercent: 0, duration: wordDuration, ease },
              i * staggerDelay
            );
        });
        return tl;
      },
      [wordNodes, staggerDelay, wordDuration, ease]
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

    const reset = useCallback(() => {
      timelineRef.current?.kill();
      wordNodes().forEach(
        (node) => node && gsap.set(node, { y: 0, yPercent: HIDDEN_Y_PERCENT })
      );
    }, [wordNodes]);

    const timeline = useCallback(() => {
      if (skipMotion) {
        showFinal();
        return gsap.timeline();
      }
      return build(gsap.timeline());
    }, [skipMotion, showFinal, build]);

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
      >
        {/* Read as one phrase; the animated words are decorative. */}
        <span className={styles.srOnly}>{text}</span>
        <span aria-hidden="true">
          {words.map((word, i) => (
            <Fragment key={i}>
              {i > 0 ? ' ' : null}
              <span className={styles.mask}>
                <span
                  ref={(node) => {
                    nodesRef.current[i] = node;
                    // The CSS already hides the word for first paint; GSAP
                    // needs the same offset as yPercent, or it reads the CSS
                    // transform as a fixed pixel y that never clears.
                    if (node && primedNodesRef.current[i] !== node) {
                      gsap.set(node, { y: 0, yPercent: HIDDEN_Y_PERCENT });
                      primedNodesRef.current[i] = node;
                    }
                  }}
                  className={
                    wordClassName
                      ? `${styles.word} ${wordClassName}`
                      : styles.word
                  }
                >
                  {word}
                </span>
              </span>
            </Fragment>
          ))}
        </span>
      </Tag>
    );
  }
);

export default WordReveal;
