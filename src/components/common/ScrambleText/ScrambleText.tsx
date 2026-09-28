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
import ScrambleLetter from './ScrambleLetter';
import type {
  ScrambleTextHandle,
  ScrambleTextProps
} from './ScrambleText.types';

const ScrambleText = forwardRef<ScrambleTextHandle, ScrambleTextProps>(
  function ScrambleText(
    {
      text,
      as: Tag = 'span',
      className,
      letterClassName,
      trigger = 'mount',
      startDelay = 0,
      staggerDelay = 0.045,
      letterDuration = 0.9,
      ease = EASE_SIGNATURE,
      scrambleEnabled = true,
      scramble,
      respectReducedMotion = true,
      inViewOptions,
      onStart,
      onComplete
    },
    forwardedRef
  ) {
    const letters = useMemo(() => Array.from(text), [text]);
    const nodesRef = useRef<Array<HTMLSpanElement | null>>([]);
    const replaysRef = useRef<Array<(() => void) | null>>([]);
    // Tracks which node each index was last *primed* for. React calls a
    // callback ref with null on every detach (which happens whenever
    // useScramble's `replay` identity changes and re-runs the effect that
    // calls registerLetter, i.e. most renders) before reattaching the same
    // node — so comparing against nodesRef alone always sees null -> node as
    // "new". This ref is only ever written when we actually prime, so it
    // survives the null call and correctly reflects the last real node.
    const primedNodesRef = useRef<Array<HTMLSpanElement | null>>([]);
    const timelineRef = useRef<gsap.core.Timeline | null>(null);
    const hasPlayedRef = useRef(false);
    const reducedMotion = useReducedMotion();
    const { ref: inViewRef, inView } = useInView<HTMLElement>(inViewOptions);

    const registerLetter = useCallback(
      (
        index: number,
        node: HTMLSpanElement | null,
        replay: (() => void) | null
      ) => {
        nodesRef.current[index] = node;
        replaysRef.current[index] = replay;
        // Only prime a genuinely new DOM node — see primedNodesRef above for
        // why the comparison can't just be against the previous nodesRef
        // value. The letter starts hidden via a plain CSS transform (so
        // SSR/first paint already shows the pre-reveal state with no FOUC).
        // GSAP doesn't know about that CSS-authored transform though: on its
        // first touch it parses the existing 100% offset as a fixed pixel
        // `y`, not as `yPercent` — so it must be explicitly zeroed here, or
        // that stray pixel offset lingers forever even after yPercent is
        // later tweened to 0.
        if (node && primedNodesRef.current[index] !== node) {
          gsap.set(node, { y: 0, yPercent: 100 });
          primedNodesRef.current[index] = node;
        }
      },
      []
    );

    const skipMotion = reducedMotion && respectReducedMotion;

    const showFinal = useCallback(() => {
      nodesRef.current.forEach(
        (node) => node && gsap.set(node, { yPercent: 0 })
      );
    }, []);

    // Adds the whole reveal to `tl`, starting at its 0. Each scramble reads
    // the letter's replay when it fires, not when the timeline is built: the
    // letters re-register a fresh replay on most renders.
    const build = useCallback(
      (tl: gsap.core.Timeline) => {
        letters.forEach((char, i) => {
          if (char === ' ') return;
          const at = i * staggerDelay;
          const node = nodesRef.current[i];
          if (scrambleEnabled)
            tl.call(() => replaysRef.current[i]?.(), undefined, at);
          if (node)
            tl.to(node, { yPercent: 0, duration: letterDuration, ease }, at);
        });
        return tl;
      },
      [letters, staggerDelay, letterDuration, ease, scrambleEnabled]
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
        (node) => node && gsap.set(node, { y: 0, yPercent: 100 })
      );
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
      <Tag ref={inViewRef} className={className} aria-label={text}>
        {letters.map((char, i) => (
          <ScrambleLetter
            key={i}
            char={char}
            index={i}
            className={letterClassName}
            scrambleOptions={scramble}
            registerLetter={registerLetter}
          />
        ))}
      </Tag>
    );
  }
);

export default ScrambleText;
