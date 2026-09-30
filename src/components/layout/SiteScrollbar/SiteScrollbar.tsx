'use client';

import { useLenis } from 'lenis/react';
import { useCallback, useEffect, useRef, type PointerEvent } from 'react';
import { scrollFor, thumbFor, type Thumb } from '@/lib/scroll/scrollbar';
import styles from './SiteScrollbar.module.scss';

/** How long it stays bright after the page stops, in ms. */
const SETTLE = 900;

const scrollLimit = () =>
  document.documentElement.scrollHeight - window.innerHeight;

// The site's scrollbar, in place of the browser's on screens with a mouse
// (globals.scss hides that one there; touch screens keep theirs, and this
// hides itself): a hairline down the right edge, and a gilt thumb as long,
// of it, as the screen is of the page. It brightens while the page moves
// and under the pointer; the thumb drags, and a click along the line goes
// there. It's for the eye and the mouse only: the page scrolls by wheel,
// keys and assistive tech as it always does, so it stays out of the
// accessibility tree.
export default function SiteScrollbar() {
  const barRef = useRef<HTMLDivElement | null>(null);
  const thumbRef = useRef<Thumb | null>(null);
  const dragRef = useRef<{ pointer: number; from: number; offset: number }>(
    null
  );
  const lenis = useLenis();

  // By Lenis where it runs, so a click along the line glides there as
  // the wheel does; a drag goes at once.
  const scrollTo = useCallback(
    (top: number, immediate: boolean) => {
      if (lenis) lenis.scrollTo(top, { immediate });
      else window.scrollTo({ top, behavior: immediate ? 'instant' : 'smooth' });
    },
    [lenis]
  );

  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return;
    let frame = 0;
    let settle = 0;

    // Hidden, it keeps its size (see the module), so it can be measured
    // back into view.
    const draw = () => {
      frame = 0;
      const thumb = thumbFor({
        track: bar.clientHeight,
        viewport: window.innerHeight,
        content: document.documentElement.scrollHeight,
        scroll: window.scrollY
      });
      thumbRef.current = thumb;
      bar.toggleAttribute('data-hidden', !thumb);
      if (!thumb) return;
      bar.style.setProperty('--thumb-size', `${thumb.size}px`);
      bar.style.setProperty('--thumb-offset', `${thumb.offset}px`);
    };
    const request = () => {
      if (!frame) frame = requestAnimationFrame(draw);
    };
    const onScroll = () => {
      request();
      bar.setAttribute('data-active', '');
      window.clearTimeout(settle);
      settle = window.setTimeout(
        () => bar.removeAttribute('data-active'),
        SETTLE
      );
    };

    draw();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', request);
    // The page grows and shrinks under it: images load, sections pin, a
    // new page comes in.
    const observer =
      typeof ResizeObserver === 'undefined'
        ? null
        : new ResizeObserver(request);
    observer?.observe(document.body);
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(settle);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', request);
      observer?.disconnect();
    };
  }, []);

  const onThumbDown = (event: PointerEvent<HTMLDivElement>) => {
    const thumb = thumbRef.current;
    if (event.button !== 0 || !thumb) return;
    // Not a click on the line under it, and no text selected on the way.
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      pointer: event.pointerId,
      from: event.clientY,
      offset: thumb.offset
    };
    barRef.current?.setAttribute('data-dragging', '');
  };

  const onThumbMove = (event: PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    const thumb = thumbRef.current;
    const bar = barRef.current;
    if (!drag || drag.pointer !== event.pointerId || !thumb || !bar) return;
    const offset = drag.offset + event.clientY - drag.from;
    scrollTo(
      scrollFor({
        track: bar.clientHeight,
        size: thumb.size,
        limit: scrollLimit(),
        offset
      }),
      true
    );
  };

  const onThumbUp = (event: PointerEvent<HTMLDivElement>) => {
    if (dragRef.current?.pointer !== event.pointerId) return;
    dragRef.current = null;
    barRef.current?.removeAttribute('data-dragging');
  };

  // A click along the line: the page goes there, the thumb centred on it.
  const onTrackDown = (event: PointerEvent<HTMLDivElement>) => {
    const thumb = thumbRef.current;
    const bar = barRef.current;
    if (event.button !== 0 || !thumb || !bar) return;
    event.preventDefault();
    const offset =
      event.clientY - bar.getBoundingClientRect().top - thumb.size / 2;
    scrollTo(
      scrollFor({
        track: bar.clientHeight,
        size: thumb.size,
        limit: scrollLimit(),
        offset
      }),
      false
    );
  };

  return (
    <div
      ref={barRef}
      className={styles.bar}
      aria-hidden="true"
      data-hidden
      onPointerDown={onTrackDown}
    >
      <div
        className={styles.thumb}
        onPointerDown={onThumbDown}
        onPointerMove={onThumbMove}
        onPointerUp={onThumbUp}
        onPointerCancel={onThumbUp}
        onLostPointerCapture={onThumbUp}
      />
    </div>
  );
}
