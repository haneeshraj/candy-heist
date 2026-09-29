'use client';

import { forwardRef, Fragment, useImperativeHandle, useRef } from 'react';
import { gsap } from '@/lib/animation/gsap';
import {
  WordReveal,
  type WordRevealHandle
} from '@/components/common/WordReveal';
import type {
  RichWordRevealHandle,
  RichWordRevealProps
} from './RichWordReveal.types';

// WordReveal for copy with a change of voice in it (a phrase in the accent
// italic, a placeholder still to be written): each run is its own
// WordReveal, and the runs rise one after another as a single reveal, the
// stagger carrying straight on from one run into the next.
const RichWordReveal = forwardRef<RichWordRevealHandle, RichWordRevealProps>(
  function RichWordReveal(
    {
      segments,
      as: Tag = 'p',
      className,
      emphasisClassName,
      placeholderClassName,
      staggerDelay = 0.04,
      wordDuration = 0.9
    },
    forwardedRef
  ) {
    const handlesRef = useRef<Array<WordRevealHandle | null>>([]);

    useImperativeHandle(forwardedRef, () => {
      const timeline = () => {
        const tl = gsap.timeline();
        let at = 0;
        segments.forEach((segment, i) => {
          const handle = handlesRef.current[i];
          if (handle) tl.add(handle.timeline(), at);
          at += segment.text.split(/\s+/).filter(Boolean).length * staggerDelay;
        });
        return tl;
      };
      return {
        timeline,
        play: () =>
          new Promise<void>((resolve) => {
            const tl = timeline();
            if (tl.duration() === 0) resolve();
            else tl.eventCallback('onComplete', () => resolve());
          }),
        reset: () => handlesRef.current.forEach((handle) => handle?.reset())
      };
    }, [segments, staggerDelay]);

    return (
      <Tag className={className}>
        {segments.map((segment, i) => {
          // A space between runs, wherever the copy has one at the seam.
          const spaced =
            i > 0 &&
            (/^\s/.test(segment.text) || /\s$/.test(segments[i - 1].text));
          const voice = segment.emphasis
            ? emphasisClassName
            : segment.placeholder
              ? placeholderClassName
              : undefined;
          return (
            <Fragment key={i}>
              {spaced ? ' ' : null}
              <WordReveal
                ref={(handle) => {
                  handlesRef.current[i] = handle;
                }}
                text={segment.text}
                trigger="manual"
                className={voice}
                staggerDelay={staggerDelay}
                wordDuration={wordDuration}
              />
            </Fragment>
          );
        })}
      </Tag>
    );
  }
);

export default RichWordReveal;
