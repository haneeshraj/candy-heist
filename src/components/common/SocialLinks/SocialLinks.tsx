'use client';

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
import styles from './SocialLinks.module.scss';
import type { SocialLinksProps, SocialSquareProps } from './SocialLinks.types';

const GLYPHS: Record<SocialPlatform, ComponentType<IconProps>> = {
  instagram: InstagramIcon,
  soundcloud: SoundCloudIcon,
  spotify: SpotifyIcon,
  youtube: YouTubeIcon
};

// The navbar's pull, so the squares feel the same wherever they are.
const PULL = { strength: 0.2, innerStrength: 0.1 };

function SocialSquare({ social }: SocialSquareProps) {
  const { ref, innerRef } = useMagnetic<HTMLAnchorElement, HTMLSpanElement>(
    PULL
  );
  const Glyph = GLYPHS[social.platform];
  return (
    <a
      ref={ref}
      className={styles.square}
      href={social.href}
      target="_blank"
      rel="noopener noreferrer"
    >
      <span ref={innerRef} className={styles.glyph}>
        <Glyph />
      </span>
      <span className={styles.srOnly}>{social.label} (opens in a new tab)</span>
    </a>
  );
}

// Figma "Navbar / Social", square style: gilt-framed squares, one per
// profile, that fill gilt on hover. The navbar's own menu keeps its bare
// glyphs from tablet up; this is the framed square everywhere.
export default function SocialLinks({
  links,
  label,
  className,
  itemMotion
}: SocialLinksProps) {
  return (
    <ul
      className={className ? `${styles.list} ${className}` : styles.list}
      aria-label={label}
    >
      {links.map((social) => (
        <li key={social.platform} data-motion={itemMotion}>
          <SocialSquare social={social} />
        </li>
      ))}
    </ul>
  );
}
