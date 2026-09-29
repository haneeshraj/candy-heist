'use client';

import { useEffect, type RefObject } from 'react';
import { EASE_SIGNATURE, gsap } from '@/lib/animation/gsap';
import { revealOnce } from '@/lib/animation/reveal';
import {
  BELOW_DESKTOP_QUERY,
  DESKTOP_QUERY,
  MOTION_OK_QUERY
} from '@/lib/constants/breakpoints';
import type { RevealMap } from '../reveals';
import { CANVAS, DISC, FRAME, INTRO_POSE, ORB } from './journeyDecor';

// The storyboard's choreography. Desktop is one timeline scrubbed by the
// scroll while the stage is pinned: a unit of it is a screen of scroll
// (the stylesheet makes the journey JOURNEY_SCREENS + 1 screens tall), and
// it runs backwards when you scroll back up. Phones and reduced motion
// stack the screens; phones play each group once as it comes into view,
// reduced motion just shows it all.
//
// Every scrubbed tween is a fromTo that doesn't render until the playhead
// reaches it: the stylesheet draws each element's state before its first
// tween, and each later tween starts from where the one before left it.

export const JOURNEY_SCREENS = 9.5;

const SCRUB = 0.6; // seconds of catch-up on top of Lenis' own smoothing
const MOVE = 'power2.inOut';
const SIG = EASE_SIGNATURE;
const ORIGIN = `${ORB.cx} ${ORB.cy}`; // the orb's centre, in SVG units

const hook = (name: string) => `[data-motion="${name}"]`;
type Select = (selector: string) => Element[];

// Boxes on the 1440 × 900 canvas, in % of it, so they need no measuring.
const pct = (n: number, of: number) => `${(n / of) * 100}%`;
const box = (x: number, y: number, w: number, h: number) => ({
  left: pct(x, CANVAS.width),
  top: pct(y, CANVAS.height),
  width: pct(w, CANVAS.width),
  height: pct(h, CANVAS.height)
});
const DISC_BOX = {
  ...box(ORB.cx - DISC.r, ORB.cy - DISC.r, DISC.r * 2, DISC.r * 2),
  borderRadius: '50%'
};
const FRAME_BOX = {
  ...box(FRAME.x, FRAME.y, FRAME.width, FRAME.height),
  borderRadius: '0%'
};
// Frame 1's pose of the orb, relative to where frames 2 and 3 have it.
// x and y are zeroed too: GSAP reads the stylesheet's translate as pixels
// the first time it touches the element, and would otherwise keep them.
const INTRO = {
  x: 0,
  y: 0,
  xPercent: (INTRO_POSE.x / CANVAS.width) * 100,
  yPercent: (INTRO_POSE.y / CANVAS.height) * 100,
  scale: INTRO_POSE.scale
};
const BANNER_HEIGHT = 360;

function scrubbed(
  root: HTMLElement,
  q: Select,
  reveals: RevealMap,
  banner: HTMLElement | null
) {
  const stage = q(hook('stage'))[0] as HTMLElement;
  const canvas = q(hook('canvas'))[0] as HTMLElement;
  const inst = (name: string) => q(`${hook('instrument')} ${hook(name)}`);
  const inPanel = (panel: string, name: string) =>
    q(`${hook(panel)} ${hook(name)}`);
  const panel = (name: string) => q(hook(name));

  // The banner spans the whole screen rather than the 1440 frame, so the
  // window's last box is measured, again on every refresh.
  const bannerBox = (side: 'left' | 'top' | 'width') => () => {
    const s = stage.getBoundingClientRect();
    const c = canvas.getBoundingClientRect();
    if (side === 'left') return pct(s.left - c.left, c.width);
    if (side === 'top') return pct(s.top - c.top, c.height);
    return pct(s.width, c.width);
  };

  const tl = gsap.timeline({
    defaults: { ease: 'none', immediateRender: false },
    scrollTrigger: {
      trigger: root,
      start: 'top top',
      end: 'bottom bottom',
      scrub: SCRUB,
      invalidateOnRefresh: true
    }
  });

  // A text component's reveal, squeezed into `span` units at `at`.
  const nest = (key: string, at: number, span: number) => {
    const reveal = reveals.get(key);
    if (!reveal) return;
    const child = reveal.timeline();
    if (child.duration() > 0) child.duration(span);
    tl.add(child, at);
  };
  const show = (name: string, at: number) =>
    tl.fromTo(
      panel(name),
      { autoAlpha: 0 },
      { autoAlpha: 1, duration: 0.01 },
      at
    );
  const hide = (name: string, at: number, lift = -4) =>
    tl.fromTo(
      panel(name),
      { autoAlpha: 1, yPercent: 0 },
      { autoAlpha: 0, yPercent: lift, duration: 0.4, ease: 'power1.in' },
      at
    );
  const sigil = (name: string, at: number) =>
    tl.fromTo(
      inPanel(name, 'label-sigil'),
      { rotation: -180 },
      { rotation: 0, duration: 0.45, ease: SIG },
      at
    );

  const [photoWho] = inst('photo-who');
  const rolePhotos = inst('photo-role');

  // The star field moves with the story, a little: drifting up the whole
  // way, pushed opposite the orb as it travels, drawn in as the journey
  // enters Nayara, turning slowly through the roles, dimming at the end.
  const stars = q(`${hook('stage')} > ${hook('stars')}`);
  tl.fromTo(
    stars,
    { yPercent: 0 },
    { yPercent: -8, duration: JOURNEY_SCREENS },
    0
  );
  tl.fromTo(
    stars,
    { xPercent: 0 },
    { xPercent: 2, duration: 0.95, ease: MOVE },
    0.3
  );
  tl.fromTo(
    stars,
    { scale: 1, rotation: 0 },
    { scale: 1.12, rotation: 4, duration: 1, ease: MOVE },
    2.4
  );
  tl.fromTo(
    stars,
    { xPercent: 2 },
    { xPercent: -2, duration: 0.9, ease: MOVE },
    4.45
  );
  tl.fromTo(
    stars,
    { scale: 1.12, rotation: 4 },
    { scale: 1.04, rotation: 6, duration: 0.9, ease: MOVE },
    4.45
  );
  tl.fromTo(stars, { rotation: 6 }, { rotation: 9, duration: 2.4 }, 6.5);
  tl.fromTo(stars, { autoAlpha: 1 }, { autoAlpha: 0.5, duration: 0.35 }, 8.95);

  // ---- 1 · The intro gives way; the orb moves left and his photo arrives.
  hide('panel-intro', 0.25, -6);
  tl.fromTo(
    panel('instrument'),
    INTRO,
    {
      x: 0,
      y: 0,
      xPercent: 0,
      yPercent: 0,
      scale: 1,
      duration: 0.95,
      ease: MOVE
    },
    0.3
  );
  tl.fromTo(
    inst('ticks'),
    { rotation: 0, svgOrigin: ORIGIN },
    { rotation: -24, svgOrigin: ORIGIN, duration: 1.6 },
    0.3
  );
  tl.fromTo(
    inst('logo'),
    { autoAlpha: 1, scale: 1 },
    { autoAlpha: 0, scale: 0.6, duration: 0.4, ease: 'power1.in' },
    0.45
  );
  tl.fromTo(
    photoWho,
    { autoAlpha: 0, scale: 1.35 },
    { autoAlpha: 1, scale: 1, duration: 0.7, ease: SIG },
    0.6
  );
  // The resonance lock fires: the arc sweeps, the needle drops, the point.
  tl.fromTo(
    inst('lock-arc'),
    { strokeDashoffset: 1 },
    { strokeDashoffset: 0, duration: 0.4, ease: SIG },
    1
  );
  tl.fromTo(
    inst('lock-needle'),
    { autoAlpha: 0, scaleY: 0, transformOrigin: '50% 0%' },
    {
      autoAlpha: 1,
      scaleY: 1,
      transformOrigin: '50% 0%',
      duration: 0.35,
      ease: SIG
    },
    1
  );
  tl.fromTo(
    inst('lock-point'),
    { autoAlpha: 0, scale: 0, transformOrigin: '50% 50%' },
    {
      autoAlpha: 1,
      scale: 1,
      transformOrigin: '50% 50%',
      duration: 0.2,
      ease: 'back.out(2)'
    },
    1.28
  );
  tl.fromTo(
    inst('lock-label'),
    { autoAlpha: 0, y: 8 },
    { autoAlpha: 1, y: 0, duration: 0.3 },
    1.1
  );
  tl.fromTo(
    inst('readout-real'),
    { autoAlpha: 0, x: -30 },
    { autoAlpha: 1, x: 0, duration: 0.4, stagger: 0.15, ease: SIG },
    1
  );
  tl.fromTo(
    inst('leader'),
    { scaleX: 0, transformOrigin: '0% 50%' },
    { scaleX: 1, transformOrigin: '0% 50%', duration: 0.3, stagger: 0.15 },
    1.15
  );
  tl.fromTo(
    inst('node'),
    { scale: 0 },
    { scale: 1, duration: 0.2, stagger: 0.15, ease: 'back.out(2)' },
    1.3
  );
  tl.fromTo(
    inst('since'),
    { autoAlpha: 0 },
    { autoAlpha: 1, duration: 0.3 },
    1.3
  );

  show('panel-who', 1);
  sigil('panel-who', 1);
  nest('who.label', 1, 0.45);
  nest('who.body', 1.1, 0.75);
  nest('who.secondary', 1.45, 0.4);
  tl.fromTo(
    inPanel('panel-who', 'social'),
    { autoAlpha: 0, y: 12 },
    { autoAlpha: 1, y: 0, duration: 0.3, stagger: 0.08, ease: SIG },
    1.65
  );

  // ---- 2 · His photo sinks into Nayara; the readouts turn to its world.
  hide('panel-who', 2.4);
  tl.fromTo(
    inst('lock-arc'),
    { strokeDashoffset: 0 },
    { strokeDashoffset: -1, duration: 0.3 },
    2.4
  );
  tl.fromTo(
    inst('lock-needle'),
    { scaleY: 1, transformOrigin: '50% 0%' },
    { scaleY: 0, transformOrigin: '50% 0%', duration: 0.3 },
    2.4
  );
  tl.fromTo(
    inst('lock-point'),
    { scale: 1 },
    { scale: 0, duration: 0.15 },
    2.45
  );
  tl.fromTo(
    inst('lock-label'),
    { autoAlpha: 1 },
    { autoAlpha: 0, duration: 0.2 },
    2.4
  );
  tl.fromTo(
    inst('since'),
    { autoAlpha: 1 },
    { autoAlpha: 0, duration: 0.2 },
    2.4
  );
  tl.fromTo(
    photoWho,
    { autoAlpha: 1, scale: 1 },
    { autoAlpha: 0, scale: 0.72, duration: 0.5, ease: 'power1.in' },
    2.5
  );
  tl.fromTo(
    inst('planet'),
    { autoAlpha: 0, scale: 1.12, transformOrigin: '50% 50%' },
    {
      autoAlpha: 1,
      scale: 1,
      transformOrigin: '50% 50%',
      duration: 0.5,
      ease: SIG
    },
    2.65
  );
  tl.fromTo(
    inst('vein'),
    { strokeDashoffset: 1 },
    { strokeDashoffset: 0, duration: 0.6, stagger: 0.03, ease: SIG },
    2.75
  );
  tl.fromTo(
    inst('omun'),
    { autoAlpha: 0, scale: 0.9, svgOrigin: ORIGIN },
    { autoAlpha: 1, scale: 1, svgOrigin: ORIGIN, duration: 0.5, stagger: 0.1 },
    3
  );
  tl.fromTo(
    inst('readout-real'),
    { autoAlpha: 1, x: 0 },
    { autoAlpha: 0, x: -16, duration: 0.25, stagger: 0.1 },
    2.55
  );
  tl.fromTo(
    inst('readout-world'),
    { autoAlpha: 0, x: -16 },
    { autoAlpha: 1, x: 0, duration: 0.3, stagger: 0.1, ease: SIG },
    2.8
  );
  nest('nayara.world.0', 2.8, 0.35);
  nest('nayara.world.1', 2.9, 0.35);

  show('panel-nayara', 2.9);
  sigil('panel-nayara', 2.9);
  nest('nayara.label', 2.9, 0.45);
  nest('nayara.lead', 3, 0.45);
  nest('nayara.statement.0', 3.1, 0.4);
  nest('nayara.statement.1', 3.22, 0.4);
  nest('nayara.body', 3.3, 0.6);
  tl.fromTo(
    inPanel('panel-nayara', 'cta'),
    { autoAlpha: 0, y: 16 },
    { autoAlpha: 1, y: 0, duration: 0.3, ease: SIG },
    3.7
  );

  // ---- 3 · The orb lets go of its rings and squares into the 3:4 frame.
  hide('panel-nayara', 4.4);
  tl.fromTo(
    inst('readout-world'),
    { autoAlpha: 1, x: 0 },
    { autoAlpha: 0, x: -16, duration: 0.3, stagger: 0.08 },
    4.4
  );
  tl.fromTo(
    inst('leader'),
    { scaleX: 1, transformOrigin: '0% 50%' },
    { scaleX: 0, transformOrigin: '0% 50%', duration: 0.25 },
    4.4
  );
  tl.fromTo(inst('node'), { scale: 1 }, { scale: 0, duration: 0.2 }, 4.4);
  tl.fromTo(
    inst('omun'),
    { autoAlpha: 1, scale: 1, svgOrigin: ORIGIN },
    { autoAlpha: 0, scale: 1.08, svgOrigin: ORIGIN, duration: 0.35 },
    4.45
  );
  tl.fromTo(
    inst('ring'),
    { autoAlpha: 1, scale: 1, svgOrigin: ORIGIN },
    {
      autoAlpha: 0,
      scale: 1.1,
      svgOrigin: ORIGIN,
      duration: 0.45,
      stagger: 0.05
    },
    4.45
  );
  tl.fromTo(
    inst('ticks'),
    { autoAlpha: 1 },
    { autoAlpha: 0, duration: 0.4 },
    4.45
  );
  tl.fromTo(
    inst('planet'),
    { autoAlpha: 1 },
    { autoAlpha: 0, duration: 0.3 },
    4.5
  );
  tl.fromTo(
    photoWho,
    { autoAlpha: 0, scale: 0.72 },
    { autoAlpha: 1, scale: 1, duration: 0.4, ease: SIG },
    4.6
  );
  tl.fromTo(
    inst('window'),
    DISC_BOX,
    { ...FRAME_BOX, duration: 0.75, ease: MOVE },
    4.65
  );
  tl.fromTo(
    q(hook('frame-ticks')),
    { autoAlpha: 0, scaleX: 0, transformOrigin: '0% 100%' },
    {
      autoAlpha: 1,
      scaleX: 1,
      transformOrigin: '0% 100%',
      duration: 0.35,
      ease: SIG
    },
    5.2
  );
  tl.fromTo(
    q(hook('frame-brackets')),
    { autoAlpha: 0, scale: 1.04, transformOrigin: '50% 50%' },
    {
      autoAlpha: 1,
      scale: 1,
      transformOrigin: '50% 50%',
      duration: 0.3,
      ease: SIG
    },
    5.25
  );
  tl.fromTo(
    q(hook('frame-needle')),
    { autoAlpha: 0, scaleY: 0, transformOrigin: '50% 0%' },
    {
      autoAlpha: 1,
      scaleY: 1,
      transformOrigin: '50% 0%',
      duration: 0.3,
      ease: SIG
    },
    5.3
  );
  tl.fromTo(
    q(hook('frame-point')),
    { autoAlpha: 0, scale: 0, transformOrigin: '50% 50%' },
    {
      autoAlpha: 1,
      scale: 1,
      transformOrigin: '50% 50%',
      duration: 0.15,
      ease: 'back.out(2)'
    },
    5.55
  );

  show('panel-behind', 5);
  sigil('panel-behind', 5);
  nest('behind.label', 5, 0.45);
  nest('behind.headline', 5.1, 0.55);
  nest('behind.p0', 5.35, 0.6);
  nest('behind.p1', 5.6, 0.6);

  // ---- 4 · The paragraphs give way to the roles, one at a time.
  tl.fromTo(
    inPanel('panel-behind', 'paragraphs'),
    { autoAlpha: 1, yPercent: 0 },
    { autoAlpha: 0, yPercent: -6, duration: 0.3, ease: 'power1.in' },
    6.5
  );
  const roles = inPanel('panel-behind', 'role');
  roles.forEach((role, i) => {
    const at = 6.7 + i * 0.75;
    const part = (name: string) => role.querySelector(hook(name));
    if (i > 0)
      tl.fromTo(
        roles[i - 1],
        { autoAlpha: 1, y: 0 },
        { autoAlpha: 0, y: -20, duration: 0.25, ease: 'power1.in' },
        at - 0.15
      );
    tl.fromTo(role, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.01 }, at);
    tl.fromTo(
      part('role-rule'),
      { scaleX: 0, transformOrigin: '0% 50%' },
      { scaleX: 1, transformOrigin: '0% 50%', duration: 0.3, ease: SIG },
      at
    );
    tl.fromTo(
      part('role-bar'),
      { scaleY: 0, transformOrigin: '50% 0%' },
      { scaleY: 1, transformOrigin: '50% 0%', duration: 0.35, ease: SIG },
      at + 0.05
    );
    nest(`role.${i}.title`, at + 0.05, 0.35);
    tl.fromTo(
      part('role-counter'),
      { autoAlpha: 0 },
      { autoAlpha: 1, duration: 0.2 },
      at + 0.1
    );
    nest(`role.${i}.body`, at + 0.15, 0.4);
    nest(`role.${i}.note`, at + 0.3, 0.35);
    // Each photo cuts in over the one before.
    if (rolePhotos[i])
      tl.fromTo(
        rolePhotos[i],
        { autoAlpha: 0, scale: 1.08 },
        { autoAlpha: 1, scale: 1, duration: 0.35, ease: SIG },
        at
      );
  });

  // ---- 5 · The frame widens into the banner; the text rises in under it.
  // The journey ends just as the banner has formed. Its last 0.6 or so
  // (the screen's height less the banner's) is when the next section's
  // text rises in from below, so the frame widens as that text comes up
  // and both are in place together, as in frame 5.1.
  const end = 8.8;
  tl.fromTo(
    panel('panel-behind'),
    { autoAlpha: 1 },
    { autoAlpha: 0, duration: 0.15 },
    end
  );
  tl.fromTo(
    q(
      `${hook('frame-ticks')}, ${hook('frame-brackets')}, ${hook('frame-needle')}, ${hook('frame-point')}`
    ),
    { autoAlpha: 1 },
    { autoAlpha: 0, duration: 0.12 },
    end
  );
  tl.fromTo(
    inst('window'),
    FRAME_BOX,
    {
      left: bannerBox('left'),
      top: bannerBox('top'),
      width: bannerBox('width'),
      height: pct(BANNER_HEIGHT, CANVAS.height),
      borderRadius: '0%',
      duration: 0.62,
      ease: MOVE
    },
    end + 0.02
  );
  tl.fromTo(
    inst('window-edge'),
    { autoAlpha: 1 },
    { autoAlpha: 0, duration: 0.25 },
    end + 0.35
  );
  tl.fromTo(
    inst('photo-banner'),
    { autoAlpha: 0 },
    { autoAlpha: 1, duration: 0.3 },
    end + 0.3
  );
  if (banner)
    tl.fromTo(
      banner,
      { autoAlpha: 0 },
      { autoAlpha: 1, duration: 0.06 },
      end + 0.62
    );
  tl.set({}, {}, JOURNEY_SCREENS);

  // On a fresh page the orb assembles as the heading writes itself in.
  // Not when the page opens part way down: the scroll has the say there.
  if (window.scrollY < 40)
    gsap
      .timeline({ delay: 0.1, defaults: { ease: SIG } })
      .from(inst('rings'), { autoAlpha: 0, scale: 0.9, duration: 1.4 }, 0)
      .from(inst('window'), { autoAlpha: 0, scale: 0.8, duration: 1.2 }, 0.1)
      .from(
        inst('logo'),
        { autoAlpha: 0, scale: 0.6, rotation: -30, duration: 1.2 },
        0.35
      )
      .from(panel('cue'), { autoAlpha: 0, y: 10, duration: 0.8 }, 1.4);
}

function onView(root: HTMLElement, q: Select, reveals: RevealMap) {
  const reveal = (key: string) =>
    reveals.get(key)?.timeline() ?? gsap.timeline();
  const inPanel = (panel: string, name: string) =>
    q(`${hook(panel)} ${hook(name)}`);
  const figure = (panel: string) => {
    const [still] = inPanel(panel, 'figure');
    const readouts = inPanel(panel, 'flow-readout');
    revealOnce(still, (tl) => {
      tl.from(still, { autoAlpha: 0, scale: 0.9, duration: 1 }, 0);
      if (readouts.length)
        tl.from(
          readouts,
          { autoAlpha: 0, y: 12, duration: 0.6, stagger: 0.1 },
          0.3
        );
    });
  };
  const label = (
    panel: string,
    key: string,
    rest: (tl: gsap.core.Timeline) => void
  ) => {
    const [heading] = inPanel(panel, 'label');
    revealOnce(heading, (tl) => {
      tl.from(
        inPanel(panel, 'label-sigil'),
        { rotation: -180, duration: 0.8 },
        0
      );
      tl.add(reveal(key), 0);
      rest(tl);
    });
  };

  figure('panel-intro');

  figure('panel-who');
  label('panel-who', 'who.label', (tl) => {
    tl.add(reveal('who.body'), 0.15);
    tl.add(reveal('who.secondary'), 0.6);
    tl.from(
      inPanel('panel-who', 'social'),
      { autoAlpha: 0, y: 10, duration: 0.5, stagger: 0.08 },
      0.9
    );
  });

  figure('panel-nayara');
  label('panel-nayara', 'nayara.label', (tl) => {
    tl.add(reveal('nayara.lead'), 0.15);
    tl.add(reveal('nayara.statement.0'), 0.35);
    tl.add(reveal('nayara.statement.1'), 0.5);
    tl.add(reveal('nayara.body'), 0.6);
  });
  const [cta] = inPanel('panel-nayara', 'cta');
  revealOnce(cta, (tl) => tl.from(cta, { autoAlpha: 0, y: 12, duration: 0.6 }));

  label('panel-behind', 'behind.label', (tl) => {
    tl.add(reveal('behind.headline'), 0.15);
  });
  q(`${hook('panel-behind')} ${hook('paragraphs')} > *`).forEach(
    (paragraph, i) =>
      revealOnce(paragraph, (tl) => tl.add(reveal(`behind.p${i}`)))
  );
  const [frame] = inPanel('panel-behind', 'flow-frame');
  revealOnce(frame, (tl) =>
    tl.from(frame, { autoAlpha: 0, y: 24, duration: 0.9 })
  );
  inPanel('panel-behind', 'role').forEach((role, i) =>
    revealOnce(role, (tl) => {
      tl.from(
        role.querySelector(hook('role-rule')),
        { scaleX: 0, transformOrigin: '0% 50%', duration: 0.6 },
        0
      );
      tl.add(reveal(`role.${i}.title`), 0.1);
      tl.from(
        role.querySelector(hook('role-counter')),
        { autoAlpha: 0, duration: 0.4 },
        0.2
      );
      tl.add(reveal(`role.${i}.body`), 0.25);
      tl.add(reveal(`role.${i}.note`), 0.5);
    })
  );
}

export function useJourneyMotion(
  rootRef: RefObject<HTMLElement | null>,
  reveals: RefObject<RevealMap>,
  bannerRef: RefObject<HTMLElement | null>
) {
  // A passive effect, so every text component below has mounted and
  // handed over its reveal before the timeline is built from them.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const mm = gsap.matchMedia();
    mm.add(
      {
        journey: `${DESKTOP_QUERY} and ${MOTION_OK_QUERY}`,
        stacked: `${BELOW_DESKTOP_QUERY} and ${MOTION_OK_QUERY}`,
        still: '(prefers-reduced-motion: reduce)'
      },
      (context) => {
        const q = gsap.utils.selector(root);
        const { journey, stacked } = context.conditions ?? {};
        if (journey) scrubbed(root, q, reveals.current, bannerRef.current);
        else if (stacked) onView(root, q, reveals.current);
        // Reduced motion: every reveal shows its final text at once (the
        // continues section's are its own hook's to show).
        else
          reveals.current.forEach((reveal, key) => {
            if (!key.startsWith('continues.')) void reveal.play();
          });
      },
      root
    );

    return () => mm.revert();
  }, [rootRef, reveals, bannerRef]);
}
