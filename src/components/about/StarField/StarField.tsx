import { STARS } from './stars';
import styles from './StarField.module.scss';

// The faint constellation behind the About screens (Figma "BG /
// Constellation"): forty stars, some of them joined, drawn over the
// 1440 × 900 frame and cropped to cover whatever box it fills.
export default function StarField({ className }: { className?: string }) {
  return (
    <svg
      className={className ? `${styles.stars} ${className}` : styles.stars}
      viewBox="0 0 1440 900"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      focusable="false"
      data-motion="stars"
    >
      <path className={styles.links} d={STARS.links} />
      {STARS.stars.map((star, i) => (
        <circle
          key={i}
          cx={star.x}
          cy={star.y}
          r={star.r}
          fillOpacity={star.opacity}
        />
      ))}
    </svg>
  );
}
