// The Candy Heist vortex, drawn from the one brand file so every use (and
// the footer's CSS mask) stays in step. Filled with currentColor; override
// fill / stroke in CSS for an outline. Decorative.

export const VORTEX_MARK_SRC = '/img/brand/vortex.svg';

export default function VortexMark({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 414.64 298.37"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      <use href={`${VORTEX_MARK_SRC}#mark`} />
    </svg>
  );
}
