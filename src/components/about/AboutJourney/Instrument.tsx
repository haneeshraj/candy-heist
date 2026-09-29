'use client';

import Image from 'next/image';
import { ClipRevealText } from '@/components/common/ClipRevealText';
import { VortexMark } from '@/components/common/VortexMark';
import type { AboutContent } from '@/content/about/about';
import type { RevealBinder } from '../reveals';
import Planet from './Planet';
import { photoFocus } from './photoFocus';
import { LOCK, OMUN_RINGS, ORB, RINGS, TICKS_PATH } from './journeyDecor';
import styles from './AboutJourney.module.scss';

interface InstrumentProps {
  content: AboutContent;
  bind: RevealBinder;
}

// The orb the whole journey is told through (desktop only): the rings and
// tick dial, the window in the middle (the logo, then his photo, then each
// role's photo as it squares into the 3:4 frame and widens into the
// banner), Nayara, the resonance lock, and the readouts on its left, which
// scramble from the real places into the world he built.
export default function Instrument({ content, bind }: InstrumentProps) {
  const { who, nayara, behind, continues } = content;

  return (
    <div className={styles.instrument} data-motion="instrument">
      <svg
        className={styles.rings}
        viewBox="0 0 1440 900"
        aria-hidden="true"
        focusable="false"
        data-motion="rings"
      >
        {RINGS.map((ring) => (
          <circle
            key={ring.id}
            cx={ORB.cx}
            cy={ORB.cy}
            r={ring.r}
            stroke={ring.stroke}
            strokeOpacity={ring.opacity}
            data-motion="ring"
          />
        ))}
        <path className={styles.ticks} d={TICKS_PATH} data-motion="ticks" />
        {OMUN_RINGS.map((ring) => (
          <circle
            key={ring.r}
            className={styles.omun}
            cx={ORB.cx}
            cy={ORB.cy}
            r={ring.r}
            strokeOpacity={ring.opacity}
            data-motion="omun"
          />
        ))}
      </svg>

      <div className={styles.window} data-motion="window">
        <span className={styles.windowPhoto} data-motion="photo-who">
          <Image
            src={who.photo.src}
            alt={who.photo.alt}
            fill
            sizes="45vw"
            className={styles.windowImage}
            style={photoFocus(who.photo)}
          />
        </span>
        {behind.roles.map((role) => (
          <span
            key={role.title}
            className={styles.windowPhoto}
            data-motion="photo-role"
          >
            <Image
              src={role.photo.src}
              alt={role.photo.alt}
              fill
              sizes="30vw"
              className={styles.windowImage}
              style={photoFocus(role.photo)}
            />
          </span>
        ))}
        <span className={styles.windowBanner} data-motion="photo-banner">
          <Image
            src={continues.banner.photo.src}
            alt=""
            fill
            sizes="100vw"
            className={styles.windowImage}
          />
        </span>
        <span className={styles.logo} data-motion="logo" aria-hidden="true">
          <VortexMark />
        </span>
        <span className={styles.windowEdge} data-motion="window-edge" />
      </div>

      <Planet />

      <svg
        className={styles.lock}
        viewBox="0 0 1440 900"
        aria-hidden="true"
        focusable="false"
      >
        <path
          className={styles.lockArc}
          d={LOCK.arc}
          strokeWidth={LOCK.width}
          pathLength={1}
          data-motion="lock-arc"
        />
        <line
          className={styles.lockNeedle}
          x1={LOCK.needle.x}
          x2={LOCK.needle.x}
          y1={LOCK.needle.top}
          y2={LOCK.needle.bottom}
          data-motion="lock-needle"
        />
        <circle
          className={styles.lockPoint}
          cx={LOCK.point.cx}
          cy={LOCK.point.cy}
          r={LOCK.point.r}
          data-motion="lock-point"
        />
      </svg>
      <p
        className={styles.lockLabel}
        data-motion="lock-label"
        aria-hidden="true"
      >
        {who.lock}
      </p>

      <div className={styles.readouts}>
        {who.readouts.map((readout, i) => {
          const world = nayara.readouts[i];
          return (
            <div key={readout.label} className={styles.readout}>
              <div className={styles.readoutFace} data-motion="readout-real">
                <p className={styles.readoutKey}>{readout.label}</p>
                <p className={styles.readoutValue}>{readout.value}</p>
                <p className={styles.readoutDetail}>{readout.detail}</p>
              </div>
              <div className={styles.readoutFace} data-motion="readout-world">
                <p className={styles.readoutKey}>{world.label}</p>
                <p className={styles.readoutValue}>
                  <span className={styles.srOnly}>{world.value}</span>
                  <span aria-hidden="true">
                    <ClipRevealText
                      ref={bind(`nayara.world.${i}`)}
                      text={world.value}
                      trigger="manual"
                      staggerDelay={0.05}
                    />
                  </span>
                </p>
                <p className={styles.readoutDetail}>{world.detail}</p>
              </div>
              <span className={styles.leader} data-motion="leader" />
              <span className={styles.node} data-motion="node" />
            </div>
          );
        })}
      </div>

      <p className={styles.since} data-motion="since">
        {who.since}
      </p>
    </div>
  );
}
