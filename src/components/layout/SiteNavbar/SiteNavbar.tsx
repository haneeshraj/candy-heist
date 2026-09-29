'use client';

import { AnimatePresence, MotionConfig, motion } from 'motion/react';
import { usePathname } from 'next/navigation';
import { useId } from 'react';
import { findActiveLink } from '@/lib/navigation/activeLink';
import NavbarPanel from './NavbarPanel';
import NavbarPill from './NavbarPill';
import styles from './SiteNavbar.module.scss';
import type { SiteNavbarProps } from './SiteNavbar.types';
import { useNavbarMenu } from './useNavbarMenu';

// The site navbar (Figma page "Navbar"). It's the navbar from Haneesh Raj's
// unfinished portfolio, reused and themed for Candy Heist, with its motion
// kept: a pill fixed to the bottom of the screen that opens a menu panel
// over a blurred page.
export default function SiteNavbar({ content }: SiteNavbarProps) {
  const pathname = usePathname();
  const panelId = useId();
  const { isOpen, toggle, close, toggleRef, panelRef } =
    useNavbarMenu(pathname);
  const active = findActiveLink(content.links, pathname);

  const names = content.toggle;
  const accessibleName = isOpen
    ? names.close
    : active
      ? `${names.open} (${active.label})`
      : names.open;

  return (
    // Drops the movement for reduced motion; the stylesheet drops the wipes.
    <MotionConfig reducedMotion="user">
      <AnimatePresence>
        {isOpen ? (
          <motion.div
            key="overlay"
            className={styles.overlay}
            aria-hidden="true"
            onClick={close}
            initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
            animate={{ opacity: 1, backdropFilter: 'blur(10px)' }}
            exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
            transition={{ duration: 0.6 }}
          />
        ) : null}
      </AnimatePresence>

      <NavbarPill
        ref={toggleRef}
        label={
          isOpen ? content.menuLabel : (active?.label ?? content.menuLabel)
        }
        open={isOpen}
        panelId={panelId}
        accessibleName={accessibleName}
        onToggle={toggle}
      />

      <AnimatePresence>
        {isOpen ? (
          <NavbarPanel
            key="panel"
            ref={panelRef}
            id={panelId}
            content={content}
            activeHref={active?.href}
            onNavigate={close}
          />
        ) : null}
      </AnimatePresence>
    </MotionConfig>
  );
}
