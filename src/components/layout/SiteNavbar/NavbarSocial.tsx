'use client';

import { motion } from 'motion/react';
import type { ComponentType } from 'react';
import {
  InstagramIcon,
  SoundCloudIcon,
  SpotifyIcon,
  YouTubeIcon,
  type IconProps
} from '@/components/icons';
import type { SocialPlatform } from '@/content/site/socials';
import { useMagnetic } from '@/hooks/useMagnetic';
import { EASE_POP } from './navbarMotion';
import styles from './SiteNavbar.module.scss';
import type { NavbarSocialProps } from './SiteNavbar.types';

const GLYPHS: Record<SocialPlatform, ComponentType<IconProps>> = {
  instagram: InstagramIcon,
  soundcloud: SoundCloudIcon,
  spotify: SpotifyIcon,
  youtube: YouTubeIcon
};

// Magnetic, the glyph following a little further than its hit area.
const PULL = { strength: 0.2, innerStrength: 0.1 };

// A social link: the bare glyph from tablet up, a gilt-framed square on
// phones. Pops in on open.
export default function NavbarSocial({ social, delay }: NavbarSocialProps) {
  const { ref, innerRef } = useMagnetic<HTMLAnchorElement, HTMLSpanElement>(
    PULL
  );
  const Glyph = GLYPHS[social.platform];

  return (
    <motion.span
      className={styles.socialPop}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ duration: 0.6, delay, ease: EASE_POP }}
    >
      <a
        ref={ref}
        className={styles.social}
        href={social.href}
        target="_blank"
        rel="noopener noreferrer"
      >
        <span ref={innerRef} className={styles.socialGlyph}>
          <Glyph />
        </span>
        <span className={styles.srOnly}>
          {social.label} (opens in a new tab)
        </span>
      </a>
    </motion.span>
  );
}
