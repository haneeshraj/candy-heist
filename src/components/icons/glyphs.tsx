import Icon from './Icon';
import type { IconProps } from './Icon.types';

// Paths match the "Glyph / *" components in the Figma file, centred on the
// 12 × 12 grid (Play is nudged right for optical balance).

export function SigilIcon(props: IconProps) {
  return (
    <Icon
      path="M6 0C6.4 4.2 7.8 5.6 12 6C7.8 6.4 6.4 7.8 6 12C5.6 7.8 4.2 6.4 0 6C4.2 5.6 5.6 4.2 6 0Z"
      {...props}
    />
  );
}

export function PlayIcon(props: IconProps) {
  return <Icon path="M2.3 0.5L11.3 6L2.3 11.5Z" {...props} />;
}

export function PauseIcon(props: IconProps) {
  return <Icon path="M2 1H4.4V11H2Z M7.6 1H10V11H7.6Z" {...props} />;
}

export function ArrowIcon(props: IconProps) {
  return (
    <Icon
      path="M1.05 5.4H8.65L6.05 2.8L6.9 1.95L10.95 6L6.9 10.05L6.05 9.2L8.65 6.6H1.05Z"
      {...props}
    />
  );
}

export function ExternalIcon(props: IconProps) {
  return (
    <Icon path="M3 2H10V9H8.8V4.05L2.85 10L2 9.15L7.95 3.2H3Z" {...props} />
  );
}
