import styles from './SessionStep.module.scss';
import type { SessionOptionProps } from './SessionStep.types';

// A session in the sticky list (Figma "Booking / Option"): a radio input
// under a bordered card, so the list arrow-keys like a group.
export default function SessionOption({
  service,
  name,
  selected,
  onSelect
}: SessionOptionProps) {
  return (
    <label
      className={styles.option}
      data-selected={selected ? 'true' : undefined}
      data-enter
    >
      <input
        type="radio"
        name={name}
        value={service.id}
        checked={selected}
        onChange={() => onSelect(service.id)}
        className={styles.srOnly}
      />
      <span className={styles.optionTop}>
        <span className={styles.optionName}>{service.name}</span>
        <span className={styles.radio} aria-hidden="true">
          <span className={styles.radioDot} />
        </span>
      </span>
      <span className={styles.optionMeta}>{service.meta}</span>
      <span className={styles.optionTagline}>{service.tagline}</span>
    </label>
  );
}
