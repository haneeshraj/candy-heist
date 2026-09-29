'use client';

import { motion } from 'motion/react';
import Link from 'next/link';
import { WordBlockReveal } from '@/components/common/MotionText';
import { SigilIcon } from '@/components/icons';
import { useMagnetic } from '@/hooks/useMagnetic';
import { EASE_POP } from './navbarMotion';
import styles from './SiteNavbar.module.scss';
import type { NavbarLinkProps } from './SiteNavbar.types';

// Barely there: at most a few pixels toward the pointer, at a link's far ends.
const PULL = { strength: 0.035, innerStrength: 0 };

// A menu link, revealed behind a sweeping gilt block. The page you're on is
// cream and carries the sigil. The magnet moves the link; the hover shift
// moves its body, so the two never fight over one transform.
export default function NavbarLink({
  link,
  current,
  onNavigate
}: NavbarLinkProps) {
  const { ref } = useMagnetic<HTMLAnchorElement>(PULL);

  return (
    <Link
      ref={ref}
      href={link.href}
      className={styles.link}
      aria-current={current ? 'page' : undefined}
      onClick={onNavigate}
    >
      <span className={styles.linkBody}>
        <WordBlockReveal text={link.label} delay={0.6} />
        {current ? (
          <motion.span
            className={styles.linkSigil}
            initial={{ scale: 0, rotate: -90 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 0.6, delay: 1.2, ease: EASE_POP }}
          >
            <SigilIcon />
          </motion.span>
        ) : null}
      </span>
    </Link>
  );
}
