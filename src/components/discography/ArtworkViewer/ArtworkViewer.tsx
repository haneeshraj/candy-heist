'use client';

import { useLenis } from 'lenis/react';
import Image from 'next/image';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  type RefObject
} from 'react';
import { CloseIcon } from '@/components/icons';
import type { DiscographyCopy } from '@/content/discography/discography';
import type { Release } from '@/content/discography/releases';
import { EASE_SIGNATURE, gsap } from '@/lib/animation/gsap';
import { MOTION_OK_QUERY } from '@/lib/constants/breakpoints';
import { fill } from '@/lib/text/fill';
import styles from './ArtworkViewer.module.scss';
import { COVER_SIZES, ownBox, placeOver } from './flight';

interface ArtworkViewerProps {
  release: Pick<Release, 'title' | 'cover' | 'credits'>;
  copy: DiscographyCopy['release'];
  open: boolean;
  /** The artwork on the page: it flies from here, and back into it. */
  originRef: RefObject<HTMLElement | null>;
  onClose: () => void;
}

const CHROME = '[data-viewer="chrome"]';

// A dialog opened and shut the native way, with a fallback for a browser
// (or a test's DOM) without showModal.
const isOpen = (dialog: HTMLDialogElement) =>
  dialog.open || dialog.hasAttribute('open');

function openDialog(dialog: HTMLDialogElement) {
  if (typeof dialog.showModal === 'function') dialog.showModal();
  else dialog.setAttribute('open', '');
}

function closeDialog(dialog: HTMLDialogElement) {
  if (typeof dialog.close === 'function') dialog.close();
  else {
    dialog.removeAttribute('open');
    dialog.dispatchEvent(new Event('close'));
  }
}

const moves = () => window.matchMedia(MOTION_OK_QUERY).matches;

// Figma "Release · Single — artwork open": the artwork large on the dark,
// and a way out. It opens as a flight: the artwork lifts off the page and
// grows into place as the dark comes up, the controls rising in after;
// shutting it (the close button, Escape, a click on the dark) flies it
// back into its place. A native modal dialog, so focus stays inside it and
// comes back to the page after; the page stops scrolling while it's open.
// With reduced motion it opens and shuts at once.
export default function ArtworkViewer({
  release,
  copy,
  open,
  originRef,
  onClose
}: ArtworkViewerProps) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const shadeRef = useRef<HTMLDivElement | null>(null);
  const mediaRef = useRef<HTMLDivElement | null>(null);
  const flightRef = useRef<gsap.core.Timeline | null>(null);
  const closingRef = useRef(false);
  const lenis = useLenis();
  const artworkBy = release.credits.find((c) => /^artwork by$/i.test(c.role));

  // Opening: into the top layer, then the flight in. Before paint, so the
  // artwork is never seen in its final place first.
  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || !open || isOpen(dialog)) return;
    openDialog(dialog);
    lenis?.stop();
    closingRef.current = false;

    const origin = originRef.current;
    const media = mediaRef.current;
    const shade = shadeRef.current;
    if (!moves() || !origin || !media || !shade) return;
    const start = placeOver(
      media.getBoundingClientRect(),
      origin.getBoundingClientRect()
    );
    gsap.set(origin, { autoAlpha: 0 });
    flightRef.current?.kill();
    flightRef.current = gsap
      .timeline({ defaults: { ease: EASE_SIGNATURE } })
      .fromTo(
        shade,
        { autoAlpha: 0 },
        { autoAlpha: 1, duration: 0.55, ease: 'power2.out' },
        0
      )
      .fromTo(
        media,
        { ...start, transformOrigin: '0 0' },
        { x: 0, y: 0, scale: 1, duration: 0.85 },
        0
      )
      .fromTo(
        dialog.querySelectorAll(CHROME),
        { autoAlpha: 0, y: 14 },
        { autoAlpha: 1, y: 0, duration: 0.5, stagger: 0.06 },
        0.35
      );
  }, [open, lenis, originRef]);

  // Shutting it: the flight back, from wherever the artwork is now (a
  // flight in can be turned back halfway), then out of the top layer.
  const close = useCallback(() => {
    const dialog = dialogRef.current;
    if (!dialog || !isOpen(dialog) || closingRef.current) return;
    closingRef.current = true;
    const origin = originRef.current;
    const media = mediaRef.current;
    const shade = shadeRef.current;
    const land = () => closeDialog(dialog);
    flightRef.current?.kill();
    if (!moves() || !origin || !media || !shade) return land();

    const x = Number(gsap.getProperty(media, 'x')) || 0;
    const y = Number(gsap.getProperty(media, 'y')) || 0;
    const scale = Number(gsap.getProperty(media, 'scale')) || 1;
    const own = ownBox(media.getBoundingClientRect(), x, y, scale);
    const target = placeOver(own, origin.getBoundingClientRect());
    flightRef.current = gsap
      .timeline({ onComplete: land })
      .to(
        dialog.querySelectorAll(CHROME),
        { autoAlpha: 0, duration: 0.2, ease: 'power1.out' },
        0
      )
      .to(
        media,
        {
          ...target,
          transformOrigin: '0 0',
          duration: 0.65,
          ease: EASE_SIGNATURE
        },
        0
      )
      .to(shade, { autoAlpha: 0, duration: 0.5, ease: 'power2.inOut' }, 0.12);
  }, [originRef]);

  // However it shut (a flight back, or the browser's own close), the page
  // gets its artwork and its scroll back.
  const onClosed = () => {
    flightRef.current?.kill();
    flightRef.current = null;
    closingRef.current = false;
    const origin = originRef.current;
    if (origin) gsap.set(origin, { clearProps: 'opacity,visibility' });
    const dialog = dialogRef.current;
    if (dialog)
      gsap.set(dialog.querySelectorAll(CHROME), { clearProps: 'all' });
    if (shadeRef.current) gsap.set(shadeRef.current, { clearProps: 'all' });
    lenis?.start();
    onClose();
  };

  // Put back what a flight left behind, should the viewer go mid-flight.
  useEffect(
    () => () => {
      flightRef.current?.kill();
      const origin = originRef.current;
      if (origin) gsap.set(origin, { clearProps: 'opacity,visibility' });
    },
    [originRef]
  );

  return (
    <dialog
      ref={dialogRef}
      className={styles.viewer}
      aria-label={copy.viewArtwork}
      onClose={onClosed}
      // Escape shuts it with the flight back, not the browser's cut.
      onKeyDown={(event) => {
        if (event.key !== 'Escape') return;
        event.preventDefault();
        close();
      }}
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
    >
      <div
        ref={shadeRef}
        className={styles.shade}
        onClick={close}
        aria-hidden="true"
      />
      <div className={styles.layer}>
        <div className={styles.top} data-viewer="chrome">
          <button type="button" className={styles.close} onClick={close}>
            <CloseIcon className={styles.closeGlyph} />
            <span className={styles.srOnly}>{copy.close}</span>
          </button>
        </div>

        {open && (
          <figure className={styles.figure}>
            <div ref={mediaRef} className={styles.art}>
              <Image
                src={release.cover.src}
                alt={release.cover.alt}
                fill
                loading="eager"
                sizes={COVER_SIZES}
                className={styles.image}
              />
            </div>
            <figcaption className={styles.caption} data-viewer="chrome">
              {release.title}
              {artworkBy
                ? ` · ${fill(copy.artworkBy, { names: artworkBy.names.join(', ') })}`
                : ''}
            </figcaption>
          </figure>
        )}
      </div>
    </dialog>
  );
}
