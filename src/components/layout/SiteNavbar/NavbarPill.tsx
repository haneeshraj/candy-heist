'use client';

import { motion } from 'motion/react';
import { VortexMark } from '@/components/common/VortexMark';
import { useMagnetic } from '@/hooks/useMagnetic';
import NavbarLabel from './NavbarLabel';
import NavbarToggle from './NavbarToggle';
import { BLOCK_CLIP, EASE_WIPE } from './navbarMotion';
import styles from './SiteNavbar.module.scss';
import type { NavbarPillProps } from './SiteNavbar.types';

// Very slight: a hovered block leans a pixel or two toward the pointer and
// its icon a little further.
const BLOCK_PULL = { strength: 0.06, innerStrength: 0.12 };

// The fixed pill (a full-width bar on phones): the vortex, the page you're
// on (MENU while open) and the menu toggle. The whole pill is one button.
// Each block wipes in on load: the logo from the right, the label from its
// centre, the toggle from the left.
export default function NavbarPill({
  ref,
  label,
  open,
  panelId,
  accessibleName,
  onToggle
}: NavbarPillProps) {
  const { ref: logoRef, innerRef: logoInnerRef } = useMagnetic<
    HTMLSpanElement,
    HTMLSpanElement
  >(BLOCK_PULL);
  const { ref: labelRef, innerRef: labelInnerRef } = useMagnetic<
    HTMLSpanElement,
    HTMLSpanElement
  >(BLOCK_PULL);
  const { ref: toggleRef, innerRef: toggleInnerRef } = useMagnetic<
    HTMLSpanElement,
    HTMLSpanElement
  >(BLOCK_PULL);

  return (
    <button
      ref={ref}
      type="button"
      className={styles.pill}
      data-open={open ? 'true' : undefined}
      aria-expanded={open}
      aria-controls={panelId}
      aria-label={accessibleName}
      onClick={onToggle}
    >
      <motion.span
        ref={logoRef}
        className={styles.block}
        data-block="logo"
        initial={{ clipPath: BLOCK_CLIP.fromRight }}
        animate={{ clipPath: BLOCK_CLIP.full }}
        transition={{ duration: 0.8, ease: EASE_WIPE, delay: 0.3 }}
      >
        <span ref={logoInnerRef} className={styles.logo}>
          <VortexMark className={styles.logoMark} />
        </span>
      </motion.span>

      <motion.span
        ref={labelRef}
        className={styles.block}
        data-block="label"
        initial={{ clipPath: BLOCK_CLIP.fromCentre }}
        animate={{ clipPath: BLOCK_CLIP.full }}
        transition={{ duration: 0.8, ease: EASE_WIPE }}
      >
        <span ref={labelInnerRef} className={styles.labelWrap}>
          <NavbarLabel text={label} />
        </span>
      </motion.span>

      <motion.span
        ref={toggleRef}
        className={styles.block}
        data-block="toggle"
        initial={{ clipPath: BLOCK_CLIP.fromLeft }}
        animate={{ clipPath: BLOCK_CLIP.full }}
        transition={{ duration: 0.8, ease: EASE_WIPE, delay: 0.2 }}
      >
        <span ref={toggleInnerRef} className={styles.toggleWrap}>
          <NavbarToggle open={open} />
        </span>
      </motion.span>
    </button>
  );
}
