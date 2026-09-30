import { STARS } from './stars';
import styles from './StarField.module.scss';

interface StarFieldProps {
  className?: string;
  /** A quarter of the stars brighten and dim, each on its own slow cycle. */
  twinkle?: boolean;
}

// The faint constellation behind the About and lore screens (Figma "BG /
// Constellation"): forty stars, some of them joined, drawn over the
// 1440 × 900 frame and cropped to cover whatever box it fills.
export default function StarField({ className, twinkle }: StarFieldProps) {
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
      {STARS.stars.map((star, i) => {
        const cycle = twinkle ? star.twinkle : undefined;
        return (
          <circle
            key={i}
            className={cycle ? styles.twinkle : undefined}
            cx={star.x}
            cy={star.y}
            r={star.r}
            // A twinkling star peaks brighter than the rest.
            fillOpacity={cycle ? 0.85 : star.opacity}
            style={
              cycle
                ? {
                    animationDuration: cycle.duration,
                    animationDelay: cycle.delay
                  }
                : undefined
            }
          />
        );
      })}
    </svg>
  );
}
