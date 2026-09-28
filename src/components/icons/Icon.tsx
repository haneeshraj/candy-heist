import type { BaseIconProps } from './Icon.types';

// Every glyph is a single filled shape on a 12 × 12 grid, coloured by
// currentColor so the surrounding component's state styles drive it.
// Decorative by default; an icon that must carry meaning on its own needs
// aria-hidden={false}, role="img" and an aria-label.
export default function Icon({ path, ...props }: BaseIconProps) {
  return (
    <svg
      viewBox="0 0 12 12"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <path d={path} />
    </svg>
  );
}
