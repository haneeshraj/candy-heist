'use client';

import { motion } from 'motion/react';
import { CornerTicks } from '@/components/common/CornerTicks';
import { EASE_RISE, LetterUp, WordUp } from '@/components/common/MotionText';
import { SigilChip } from '@/components/common/SigilChip';
import { VortexMark } from '@/components/common/VortexMark';
import { ArrowIcon } from '@/components/icons';
import NavbarLink from './NavbarLink';
import NavbarSocial from './NavbarSocial';
import { EASE_SWAP, PANEL_CLIP } from './navbarMotion';
import styles from './SiteNavbar.module.scss';
import type { NavbarPanelProps } from './SiteNavbar.types';
import { useWatermarkTilt } from './useWatermarkTilt';

// The menu (Figma "Navbar / Panel" and "Mobile panel"): links, socials, the
// Book a session chip and credits over a faint vortex that leans toward the
// cursor. It opens out of a point at the pill, then its contents follow in
// the portfolio's order: heading, links, socials one by one, then the rest.
export default function NavbarPanel({
  ref,
  id,
  content,
  activeHref,
  onNavigate
}: NavbarPanelProps) {
  const tilt = useWatermarkTilt();

  return (
    <motion.nav
      ref={ref}
      id={id}
      className={styles.panel}
      aria-label={content.menuLabel}
      data-lenis-prevent
      initial={{ clipPath: PANEL_CLIP.point }}
      animate={{
        clipPath: [PANEL_CLIP.point, PANEL_CLIP.strip, PANEL_CLIP.full]
      }}
      exit={{ clipPath: [PANEL_CLIP.full, PANEL_CLIP.band, PANEL_CLIP.point] }}
      transition={{ duration: 1, ease: EASE_SWAP }}
      onPointerMove={tilt.onPointerMove}
      onPointerLeave={tilt.onPointerLeave}
    >
      <motion.span
        className={styles.watermark}
        aria-hidden="true"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.05 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <motion.span className={styles.watermarkTilt} style={tilt.style}>
          <VortexMark className={styles.watermarkMark} />
        </motion.span>
      </motion.span>
      <CornerTicks inset={-12} className={styles.ticks} />

      <div className={styles.menu}>
        <h2 className={styles.menuHeading}>
          <span aria-hidden="true">✦</span>
          <LetterUp text={content.menuLabel} delay={0.4} />
        </h2>
        <ul className={styles.links}>
          {content.links.map((link) => (
            <li key={link.href}>
              <NavbarLink
                link={link}
                current={link.href === activeHref}
                onNavigate={onNavigate}
              />
            </li>
          ))}
        </ul>
      </div>

      <ul className={styles.socials} aria-label={content.socialsLabel}>
        {content.socials.map((social, i) => (
          <li key={social.platform}>
            <NavbarSocial social={social} delay={0.6 + i * 0.15} />
          </li>
        ))}
      </ul>

      <motion.div
        className={styles.cta}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.6, ease: EASE_RISE }}
      >
        <SigilChip
          href={content.cta.href}
          size="sm"
          icon={<ArrowIcon />}
          onClick={onNavigate}
        >
          {content.cta.label}
        </SigilChip>
      </motion.div>

      <div className={styles.credits}>
        <WordUp
          as="p"
          text={content.copyright}
          className={styles.copyright}
          delay={0.4}
        />
        <WordUp
          as="p"
          text={content.credit}
          className={styles.credit}
          delay={0.6}
        />
      </div>
    </motion.nav>
  );
}
