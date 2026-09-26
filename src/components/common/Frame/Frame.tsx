'use client';

import { useEffect, useRef, type CSSProperties } from 'react';
import { gsap } from '@/lib/animation/gsap';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { DESKTOP_QUERY } from '@/lib/constants/breakpoints';
import styles from './Frame.module.scss';
import type { FrameProps } from './Frame.types';

export default function Frame({
  children,
  className,
  as: Tag = 'div',
  radius = 0,
  travel = 160,
  parallax = 'auto'
}: FrameProps) {
  const frameRef = useRef<HTMLDivElement | null>(null);
  const innerRef = useRef<HTMLDivElement | null>(null);
  const isDesktop = useMediaQuery(DESKTOP_QUERY);
  const reducedMotion = useReducedMotion();
  const enabled = parallax === 'auto' ? isDesktop && !reducedMotion : parallax;

  useEffect(() => {
    if (!enabled) return;
    const frame = frameRef.current;
    const inner = innerRef.current;
    if (!frame || !inner) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        inner,
        { y: -travel / 2 },
        {
          y: travel / 2,
          ease: 'none',
          scrollTrigger: {
            trigger: frame,
            start: 'top bottom',
            end: 'bottom top',
            scrub: true
          }
        }
      );
    });

    return () => ctx.revert();
  }, [enabled, travel]);

  const frameStyle: CSSProperties = {
    borderRadius: radius,
    ['--frame-travel' as keyof CSSProperties]: `${travel}px`
  };

  return (
    <Tag
      ref={frameRef}
      className={className ? `${styles.frame} ${className}` : styles.frame}
      style={frameStyle}
    >
      <div ref={innerRef} className={styles.inner}>
        {children}
      </div>
    </Tag>
  );
}
