'use client';

import { useLenis } from 'lenis/react';
import Image from 'next/image';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type RefObject
} from 'react';
import { CloseIcon, PauseIcon, PlayIcon } from '@/components/icons';
import type { DiscographyCopy } from '@/content/discography/discography';
import type { Release } from '@/content/discography/releases';
import { EASE_SIGNATURE, gsap } from '@/lib/animation/gsap';
import { MOTION_OK_QUERY } from '@/lib/constants/breakpoints';
import { fill } from '@/lib/text/fill';
import styles from './ArtworkViewer.module.scss';
import {
  COVER_SIZES,
  faceBox,
  ownBox,
  placeOver,
  type ArtworkFace
} from './flight';

interface ArtworkViewerProps {
  release: Pick<Release, 'title' | 'cover' | 'canvas' | 'credits'>;
  copy: DiscographyCopy['release'];
  /** Which face it's open on, or null while it's shut. */
  open: ArtworkFace | null;
  /** The artwork on the page: it flies from here, and back into it. */
  originRef: RefObject<HTMLElement | null>;
  onFace: (face: ArtworkFace) => void;
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

// Figma "Release · Single — artwork open / canvas open": the artwork (or
// the canvas, the 9:16 loop) large on the dark, Cover | Canvas to switch
// between them, and a way out. It opens as a flight: the artwork lifts
// off the page and grows into place as the dark comes up, the controls
// rising in after; shutting it (the close button, Escape, a click on the
// dark) flies it back into its place. A native modal dialog, so focus
// stays inside it and comes back to the page after; the page stops
// scrolling while it's open. With reduced motion it opens and shuts at
// once.
export default function ArtworkViewer({
  release,
  copy,
  open,
  originRef,
  onFace,
  onClose
}: ArtworkViewerProps) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const shadeRef = useRef<HTMLDivElement | null>(null);
  const mediaRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const flightRef = useRef<gsap.core.Timeline | null>(null);
  const shownRef = useRef<ArtworkFace | null>(null);
  const closingRef = useRef(false);
  const [paused, setPaused] = useState(false);
  const lenis = useLenis();
  const face: ArtworkFace | null = open && (release.canvas ? open : 'cover');
  const artworkBy = release.credits.find((c) => /^artwork by$/i.test(c.role));

  // Opening: into the top layer, then the flight in. Before paint, so the
  // artwork is never seen in its final place first.
  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || !face || isOpen(dialog)) return;
    openDialog(dialog);
    lenis?.stop();
    closingRef.current = false;
    shownRef.current = face;

    const origin = originRef.current;
    const media = mediaRef.current;
    const shade = shadeRef.current;
    if (!moves() || !origin || !media || !shade) return;
    const start = placeOver(
      media.getBoundingClientRect(),
      faceBox(origin.getBoundingClientRect(), face)
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
  }, [face, lenis, originRef]);

  // Switching between the cover and the canvas while it's open: the new
  // face comes up in its place.
  useLayoutEffect(() => {
    const media = mediaRef.current;
    if (!face || !media || shownRef.current === face) return;
    shownRef.current = face;
    if (moves())
      gsap.fromTo(
        media,
        { autoAlpha: 0, scale: 0.97, transformOrigin: '50% 50%' },
        { autoAlpha: 1, scale: 1, duration: 0.5, ease: EASE_SIGNATURE }
      );
  }, [face]);

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
    if (!moves() || !origin || !media || !shade || !face) return land();

    const x = Number(gsap.getProperty(media, 'x')) || 0;
    const y = Number(gsap.getProperty(media, 'y')) || 0;
    const scale = Number(gsap.getProperty(media, 'scale')) || 1;
    const own = ownBox(media.getBoundingClientRect(), x, y, scale);
    const target = placeOver(
      own,
      faceBox(origin.getBoundingClientRect(), face)
    );
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
  }, [face, originRef]);

  // However it shut (a flight back, or the browser's own close), the page
  // gets its artwork and its scroll back.
  const onClosed = () => {
    flightRef.current?.kill();
    flightRef.current = null;
    closingRef.current = false;
    shownRef.current = null;
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

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) void video.play();
    else video.pause();
  };

  return (
    <dialog
      ref={dialogRef}
      className={styles.viewer}
      aria-label={face === 'canvas' ? copy.viewCanvas : copy.viewArtwork}
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
          {release.canvas ? (
            <div className={styles.faces}>
              {(['cover', 'canvas'] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  className={styles.face}
                  aria-pressed={face === f}
                  onClick={() => onFace(f)}
                >
                  {copy[f]}
                </button>
              ))}
            </div>
          ) : (
            <span />
          )}
          <button type="button" className={styles.close} onClick={close}>
            <CloseIcon className={styles.closeGlyph} />
            <span className={styles.srOnly}>{copy.close}</span>
          </button>
        </div>

        {face && (
          <figure className={styles.figure}>
            {face === 'canvas' && release.canvas ? (
              <div ref={mediaRef} className={styles.canvas}>
                <video
                  ref={videoRef}
                  className={styles.video}
                  src={release.canvas.src}
                  poster={release.canvas.poster}
                  autoPlay
                  loop
                  muted
                  playsInline
                  onPlay={() => setPaused(false)}
                  onPause={() => setPaused(true)}
                />
                <button
                  type="button"
                  className={styles.play}
                  onClick={togglePlay}
                  aria-label={paused ? copy.play : copy.pause}
                >
                  {paused ? <PlayIcon /> : <PauseIcon />}
                </button>
              </div>
            ) : (
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
            )}
            <figcaption className={styles.caption} data-viewer="chrome">
              {release.title}
              {face === 'canvas'
                ? ` · ${copy.canvasNote}`
                : artworkBy
                  ? ` · ${fill(copy.artworkBy, { names: artworkBy.names.join(', ') })}`
                  : ''}
            </figcaption>
          </figure>
        )}
      </div>
    </dialog>
  );
}
