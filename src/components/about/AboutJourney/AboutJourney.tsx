'use client';

import { useRef } from 'react';
import { StarField } from '../StarField';
import BehindPanel from './BehindPanel';
import FrameChrome from './FrameChrome';
import Instrument from './Instrument';
import IntroPanel from './IntroPanel';
import NayaraPanel from './NayaraPanel';
import WhoPanel from './WhoPanel';
import styles from './AboutJourney.module.scss';
import type { AboutJourneyProps } from './AboutJourney.types';
import { useJourneyMotion } from './useJourneyMotion';

// Figma "ABOUT PAGE — storyboard", frames 1 to 4, told as one journey.
// Desktop pins a stage while the scroll plays it like a timeline: the orb
// centred with the logo, then left with his photo and the lock, sinking
// into Nayara, squaring into the 3:4 frame on the right as the roles go by,
// and widening into the banner The signal continues sits under. Phones and
// reduced motion stack the same screens, with a still of the orb in each.
export default function AboutJourney({
  content,
  headingId,
  bind,
  reveals,
  bannerRef
}: AboutJourneyProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  useJourneyMotion(rootRef, reveals, bannerRef);

  return (
    <div ref={rootRef} className={styles.journey}>
      <div className={styles.stage} data-motion="stage">
        <StarField className={styles.stars} />
        <div className={styles.canvas} data-motion="canvas">
          <Instrument content={content} bind={bind} />
          <FrameChrome />

          <IntroPanel copy={content.intro} headingId={headingId} />
          <WhoPanel
            copy={content.who}
            streaming={content.streaming}
            bind={bind}
          />
          <NayaraPanel copy={content.nayara} bind={bind} />
          <BehindPanel
            copy={content.behind}
            photo={content.who.photo}
            bind={bind}
          />
        </div>
      </div>
    </div>
  );
}
