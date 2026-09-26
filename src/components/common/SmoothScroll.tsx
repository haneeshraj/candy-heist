'use client';

import { ReactLenis } from 'lenis/react';
import type { LenisRef } from 'lenis/react';
import { useCallback, useEffect, useState } from 'react';
import { gsap, ScrollTrigger } from '@/lib/animation/gsap';

export default function SmoothScroll({
  children
}: {
  children: React.ReactNode;
}) {
  const [lenis, setLenis] = useState<LenisRef['lenis']>();

  // ReactLenis only creates the Lenis instance in its own effect, then
  // exposes it via a state update on the next render — a useRef object
  // would still read undefined the first time our effect below runs.
  // A callback ref gets re-invoked whenever that instance changes.
  const lenisRefCallback = useCallback((instance: LenisRef | null) => {
    setLenis(instance?.lenis);
  }, []);

  useEffect(() => {
    if (!lenis) return;
    const instance = lenis;

    function update(time: number) {
      instance.raf(time * 1000);
    }

    gsap.ticker.add(update);
    gsap.ticker.lagSmoothing(0);
    instance.on('scroll', ScrollTrigger.update);

    return () => {
      gsap.ticker.remove(update);
      instance.off('scroll', ScrollTrigger.update);
    };
  }, [lenis]);

  return (
    <ReactLenis root options={{ autoRaf: false }} ref={lenisRefCallback}>
      {children}
    </ReactLenis>
  );
}
