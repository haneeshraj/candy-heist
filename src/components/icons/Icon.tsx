import type { BaseIconProps } from './Icon.types';

// Every glyph is filled shapes on a 12 × 12 grid, coloured by currentColor
// so the surrounding component's state styles drive it.
// Decorative by default; an icon that must carry meaning on its own needs
// aria-hidden={false}, role="img" and an aria-label.
export default function Icon({ path, ...props }: BaseIconProps) {
  const paths = typeof path === 'string' ? [path] : path;

  return (
    <svg
      viewBox="0 0 12 12"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {paths.map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}
