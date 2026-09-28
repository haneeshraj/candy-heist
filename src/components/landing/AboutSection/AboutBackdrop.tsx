import styles from './AboutSection.module.scss';
import { DUST_LAYERS, RINGS, ROSE_SIZE, SPOKES_PATH } from './aboutDecor';

const ROSE_VIEWBOX = `0 0 ${ROSE_SIZE} ${ROSE_SIZE}`;

// Purely decorative world geometry: a rose field of rings and spokes
// centred on the orb, and three layers of dust. Motion is applied by
// useAboutMotion through the data-motion hooks.
export default function AboutBackdrop() {
  return (
    <div className={styles.backdrop} aria-hidden="true">
      <div className={styles.rose}>
        <svg
          className={styles.rings}
          viewBox={ROSE_VIEWBOX}
          data-motion="rings"
        >
          {RINGS.map((ring) => (
            <circle
              key={ring.radius}
              cx={ROSE_SIZE / 2}
              cy={ROSE_SIZE / 2}
              r={ring.radius}
              strokeOpacity={ring.opacity}
              strokeDasharray={ring.dashed ? '2 8' : undefined}
            />
          ))}
        </svg>
        <svg
          className={styles.spokes}
          viewBox={ROSE_VIEWBOX}
          data-motion="spokes"
        >
          <path d={SPOKES_PATH} />
        </svg>
      </div>

      {DUST_LAYERS.map((layer) => (
        <div
          key={layer.depth}
          className={styles.dust}
          data-motion={`dust-${layer.depth}`}
        >
          {layer.motes.map((mote, i) => (
            <span
              key={i}
              className={styles.mote}
              style={{
                left: `${mote.x}%`,
                top: `${mote.y}%`,
                width: mote.size,
                height: mote.size,
                opacity: mote.opacity
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
