import {
  arrival,
  clamp,
  INTRO_SECONDS,
  measureShelf,
  mod,
  placeTape,
  SHELF_BEHIND,
  SHELF_FRONT,
  SHELF_POOL,
  type ShelfLayout,
  type ShelfMetrics
} from '@/lib/shelf/shelf';
import { TAPE_SPRITE } from '@/lib/shelf/tapeSprite';

// Runs the shelf on the elements TapeShelf renders: a fixed pool of tape
// links, recycled as the row moves, each placed every frame from its offset
// to the focus (lib/shelf). The row runs on its own at a steady speed until
// someone takes hold of it (a press, a drag, a key, focus), then settles on
// the nearest tape; it starts again the next time the section scrolls into
// view. Interaction is desktop only: on phones the row just runs. Driven
// imperatively in one requestAnimationFrame loop, paused off screen.

/** Tapes per second while the row runs on its own. */
const AUTO_SPEED = 0.32;
/** How quickly it gets up to speed (per second, exponential). */
const AUTO_EASE = 1.4;
/** Tapes per pixel of horizontal wheel / trackpad swipe. */
const WHEEL_SPEED = 0.0055;
/** Pixels a press has to travel before it counts as a drag. */
const DRAG_SLOP = 6;
/** How long the image decode may hold the intro back, in ms. */
const DECODE_WAIT = 1500;

export interface TapeSource {
  src: string;
  srcSet?: string;
  sizes?: string;
  href: string;
  label: string;
}

export interface ShelfCallbacks {
  /** The tape nearest the focus changed (index into the sources). */
  onFocus: (index: number) => void;
  /** The lifted tape was clicked (or Enter was pressed on it). */
  onOpen: (index: number) => void;
}

export interface ShelfOptions {
  viewport: HTMLElement;
  slots: Array<HTMLAnchorElement | null>;
  sources: TapeSource[];
  layout: ShelfLayout;
  interactive: boolean;
  reducedMotion: boolean;
  callbacks: () => ShelfCallbacks;
}

interface Slot {
  el: HTMLAnchorElement;
  img: HTMLImageElement;
  index: number | null;
  source: number | null;
}

export function createTapeShelf(options: ShelfOptions) {
  const { viewport, sources, callbacks } = options;
  const count = sources.length;
  let { layout, interactive, reducedMotion } = options;

  const slots: Slot[] = options.slots.flatMap((el) => {
    const img = el?.querySelector('img');
    return el && img ? [{ el, img, index: null, source: null }] : [];
  });

  let metrics: ShelfMetrics | null = null;
  let current = 0;
  let target = 0;
  let speed = 0;
  let auto = true;
  let dragging = false;
  let press: {
    id: number;
    x: number;
    y: number;
    lastX: number;
    lastY: number;
    lastT: number;
    velocity: number;
  } | null = null;
  let suppressClick = false;
  let lastInput = -Infinity;
  let focused: number | null = null;
  let introStart: number | null = null;
  let introQueued = false;
  let visible = false;
  let raf = 0;
  let last: number | null = null;
  let dirty = true;

  // Placing the tapes right away (hidden until the intro) also hands their
  // images to the browser, so they load as the section approaches.
  function measure() {
    metrics = measureShelf(viewport.clientWidth, viewport.clientHeight, layout);
    viewport.style.setProperty('--tape-w', `${metrics.tapeWidth}px`);
    render(performance.now());
    dirty = true;
    wake();
  }

  function assign(slot: Slot, index: number) {
    slot.index = index;
    const source = mod(index, count);
    if (slot.source === source) return;
    slot.source = source;
    const s = sources[source];
    if (s.sizes) slot.img.sizes = s.sizes;
    if (s.srcSet) slot.img.srcset = s.srcSet;
    slot.img.src = s.src;
    slot.el.href = s.href;
    slot.el.setAttribute('aria-label', s.label);
  }

  function introSeconds(now: number) {
    if (reducedMotion) return Infinity;
    if (introStart === null) return -1;
    return (now - introStart) / 1000;
  }

  function render(now: number) {
    if (!metrics) return;
    const intro = introSeconds(now);
    const base = Math.floor(current);
    for (let i = base - SHELF_FRONT; i <= base + SHELF_BEHIND + 1; i++) {
      const slot = slots[mod(i, SHELF_POOL)];
      if (!slot) continue;
      if (slot.index !== i) assign(slot, i);
      const u = i - current;
      const arrive = arrival(intro, u);
      const p = placeTape(u, metrics, arrive);
      const style = slot.el.style;
      style.transform = `translate3d(${p.x.toFixed(2)}px, ${p.y.toFixed(2)}px, 0) scale(${p.scale.toFixed(4)})`;
      style.zIndex = String(p.zIndex);
      // Depth fogs a tape towards black; the row's ends and the intro fade
      // it out instead, so no black silhouette covers the title behind.
      style.opacity = p.fade.toFixed(3);
      slot.img.style.filter = `brightness(${p.fog.toFixed(3)})`;
    }

    const nearest = Math.round(current);
    if (nearest !== focused) {
      focused = nearest;
      markFocus(true);
      callbacks().onFocus(mod(nearest, count));
    }
  }

  // Only the lifted tape is a tab stop, and only when the shelf is
  // interactive. Keyboard focus follows it along the row.
  function markFocus(moveFocus: boolean) {
    const hadFocus = slots.some((s) => s.el === document.activeElement);
    for (const slot of slots) {
      const isFocus = slot.index === focused;
      slot.el.tabIndex = interactive && isFocus ? 0 : -1;
      slot.el.dataset.focused = String(isFocus);
      if (moveFocus && isFocus && hadFocus)
        slot.el.focus({ preventScroll: true });
    }
  }

  function frame(now: number) {
    raf = 0;
    if (!visible) {
      last = null;
      return;
    }
    // Real time, so a slow device drops frames rather than slowing the row;
    // capped so a stalled tab doesn't jump.
    const dt = Math.min(0.1, (now - (last ?? now)) / 1000);
    last = now;
    const before = current;
    const introDone =
      reducedMotion ||
      (introStart !== null && now - introStart > INTRO_SECONDS * 700);

    if (auto && introDone && !reducedMotion) {
      speed += (AUTO_SPEED - speed) * (1 - Math.exp(-dt * AUTO_EASE));
      current += speed * dt;
      target = current;
    } else {
      speed = 0;
      // Settle on the nearest tape once the input stops.
      if (!dragging && now - lastInput > 140) target = Math.round(target);
      if (reducedMotion) current = target;
      else
        current +=
          (target - current) * (1 - Math.exp(-dt * (dragging ? 22 : 8)));
      if (Math.abs(target - current) < 0.0004) current = target;
    }

    const introRunning =
      introStart !== null &&
      !reducedMotion &&
      now - introStart < INTRO_SECONDS * 1000 + 100;
    const moving = current !== before || speed > 0;
    if (dirty || moving || introRunning) {
      render(now);
      dirty = false;
    }
    // Keep going while anything is still to happen, including the settle
    // onto a whole tape that follows a press.
    const settling = current !== target || !Number.isInteger(target);
    if (
      moving ||
      introRunning ||
      dragging ||
      settling ||
      (auto && !reducedMotion)
    ) {
      raf = requestAnimationFrame(frame);
    }
  }

  function wake() {
    if (!raf && visible) raf = requestAnimationFrame(frame);
  }

  // Someone took hold of the shelf: stop running, keep it where it is.
  function takeHold() {
    if (auto) {
      auto = false;
      speed = 0;
      target = current;
    }
    lastInput = performance.now();
    wake();
  }

  function goTo(index: number) {
    takeHold();
    target = index;
  }

  async function startIntro() {
    if (introQueued) return;
    introQueued = true;
    if (reducedMotion) {
      dirty = true;
      wake();
      return;
    }
    // Let the visible tapes decode first, so the row doesn't arrive empty.
    const decoding = slots.map((s) => s.img.decode().catch(() => undefined));
    await Promise.race([
      Promise.all(decoding),
      new Promise((resolve) => setTimeout(resolve, DECODE_WAIT))
    ]);
    introStart = performance.now();
    wake();
  }

  // ---- Visibility: run only on screen; restart the row on each return.

  const io = new IntersectionObserver(
    ([entry]) => {
      const wasVisible = visible;
      visible = entry.isIntersecting;
      if (visible && entry.intersectionRatio >= 0.25) void startIntro();
      if (!visible && wasVisible) auto = true;
      wake();
    },
    { threshold: [0, 0.25] }
  );
  io.observe(viewport);

  const ro =
    typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure);
  ro?.observe(viewport);

  // ---- Input (desktop): drag with a fling, horizontal swipes, arrow keys.

  function onPointerDown(event: PointerEvent) {
    if (!interactive || event.button !== 0) return;
    takeHold();
    const now = performance.now();
    press = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      lastX: event.clientX,
      lastY: event.clientY,
      lastT: now,
      velocity: 0
    };
    suppressClick = false;
  }

  function onPointerMove(event: PointerEvent) {
    if (!press || event.pointerId !== press.id || !metrics) return;
    if (
      !dragging &&
      Math.hypot(event.clientX - press.x, event.clientY - press.y) > DRAG_SLOP
    ) {
      dragging = true;
      suppressClick = true;
      viewport.setPointerCapture(event.pointerId);
      viewport.dataset.dragging = 'true';
    }
    if (!dragging) return;
    // Pushing the row away (up the diagonal) brings earlier tapes forward.
    const { rowDir } = TAPE_SPRITE;
    const along =
      (event.clientX - press.lastX) * rowDir.x +
      (event.clientY - press.lastY) * rowDir.y;
    const delta = -along / metrics.step;
    target += delta;
    const now = performance.now();
    press.velocity =
      press.velocity * 0.7 +
      (delta / Math.max(1, now - press.lastT)) * 1000 * 0.3;
    press.lastX = event.clientX;
    press.lastY = event.clientY;
    press.lastT = now;
    lastInput = now;
    wake();
  }

  function onPointerUp(event: PointerEvent) {
    if (!press || event.pointerId !== press.id) return;
    if (dragging) {
      target += clamp(press.velocity * 0.16, -3, 3);
      lastInput = performance.now();
      dragging = false;
      delete viewport.dataset.dragging;
    }
    press = null;
    wake();
  }

  function onWheel(event: WheelEvent) {
    if (!interactive) return;
    // Only sideways swipes move the shelf; vertical wheel scrolls the page.
    if (
      Math.abs(event.deltaX) <= Math.abs(event.deltaY) ||
      Math.abs(event.deltaX) < 2
    )
      return;
    event.preventDefault();
    takeHold();
    const unit = event.deltaMode === 1 ? 16 : 1;
    target += clamp(event.deltaX * unit * WHEEL_SPEED, -1.2, 1.2);
  }

  function onKeyDown(event: KeyboardEvent) {
    if (!interactive) return;
    if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
      event.preventDefault();
      goTo(Math.round(target) + 1);
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
      event.preventDefault();
      goTo(Math.round(target) - 1);
    }
  }

  function onFocusIn() {
    if (interactive) takeHold();
  }

  const clickHandlers = slots.map((slot) => {
    const handler = (event: MouseEvent) => {
      if (!interactive || suppressClick) {
        event.preventDefault();
        suppressClick = false;
        return;
      }
      if (slot.index === Math.round(current) && slot.source !== null) {
        // Opening in a new tab is the browser's job.
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
          return;
        event.preventDefault();
        callbacks().onOpen(slot.source);
      } else if (slot.index !== null) {
        event.preventDefault();
        goTo(slot.index);
      }
    };
    slot.el.addEventListener('click', handler);
    return handler;
  });

  viewport.addEventListener('pointerdown', onPointerDown);
  viewport.addEventListener('pointermove', onPointerMove);
  viewport.addEventListener('pointerup', onPointerUp);
  viewport.addEventListener('pointercancel', onPointerUp);
  viewport.addEventListener('wheel', onWheel, { passive: false });
  viewport.addEventListener('keydown', onKeyDown);
  viewport.addEventListener('focusin', onFocusIn);

  measure();

  return {
    setLayout(next: ShelfLayout) {
      layout = next;
      measure();
    },
    setInteractive(next: boolean) {
      interactive = next;
      if (!next) {
        press = null;
        dragging = false;
        delete viewport.dataset.dragging;
      }
      markFocus(false);
    },
    setReducedMotion(next: boolean) {
      reducedMotion = next;
      dirty = true;
      wake();
    },
    destroy() {
      cancelAnimationFrame(raf);
      io.disconnect();
      ro?.disconnect();
      viewport.removeEventListener('pointerdown', onPointerDown);
      viewport.removeEventListener('pointermove', onPointerMove);
      viewport.removeEventListener('pointerup', onPointerUp);
      viewport.removeEventListener('pointercancel', onPointerUp);
      viewport.removeEventListener('wheel', onWheel);
      viewport.removeEventListener('keydown', onKeyDown);
      viewport.removeEventListener('focusin', onFocusIn);
      slots.forEach((slot, i) =>
        slot.el.removeEventListener('click', clickHandlers[i])
      );
    }
  };
}

export type TapeShelfEngine = ReturnType<typeof createTapeShelf>;
