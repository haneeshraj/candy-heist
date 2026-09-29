'use client';

import { useLenis } from 'lenis/react';
import { useCallback, useEffect, useRef, useState } from 'react';

const FOCUSABLE =
  'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Open/close state for the navbar menu, and what an open menu needs: the
 * page held still (Lenis stops), Escape to close with focus back on the
 * toggle, and Tab kept inside the toggle and the panel. Navigating to
 * another page closes it.
 */
export function useNavbarMenu(pathname: string) {
  const [isOpen, setIsOpen] = useState(false);
  const [openPath, setOpenPath] = useState(pathname);
  const toggleRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLElement | null>(null);
  const lenis = useLenis();

  // Closing on navigation during render, not in an effect, so the new page
  // never paints with the old menu still open (and back/forward count too).
  if (openPath !== pathname) {
    setOpenPath(pathname);
    setIsOpen(false);
  }

  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((open) => !open), []);

  useEffect(() => {
    if (!isOpen || !lenis) return;
    lenis.stop();
    return () => lenis.start();
  }, [isOpen, lenis]);

  useEffect(() => {
    if (!isOpen) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
        toggleRef.current?.focus();
        return;
      }
      if (event.key !== 'Tab') return;

      const toggleButton = toggleRef.current;
      const panel = panelRef.current;
      if (!toggleButton || !panel) return;

      const stops = [
        toggleButton,
        ...panel.querySelectorAll<HTMLElement>(FOCUSABLE)
      ];
      const first = stops[0];
      const last = stops[stops.length - 1];
      const current = document.activeElement;

      if (!stops.some((stop) => stop === current)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      } else if (event.shiftKey && current === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && current === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen]);

  return { isOpen, toggle, close, toggleRef, panelRef };
}
