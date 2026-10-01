import styles from './ItemStep.module.scss';
import type { ItemOptionProps } from './ItemStep.types';

// An item in the sticky list (Figma "Booking / Option"): a radio input
// under a bordered card, so the list arrow-keys like a group.
export default function ItemOption({
  item,
  name,
  selected,
  onSelect
}: ItemOptionProps) {
  return (
    <label
      className={styles.option}
      data-selected={selected ? 'true' : undefined}
      data-enter
    >
      <input
        type="radio"
        name={name}
        value={item.id}
        checked={selected}
        onChange={() => onSelect(item.id)}
        className={styles.srOnly}
      />
      <span className={styles.optionTop}>
        <span className={styles.optionName}>{item.name}</span>
        <span className={styles.radio} aria-hidden="true">
          <span className={styles.radioDot} />
        </span>
      </span>
      <span className={styles.optionSummary}>{item.summary}</span>
    </label>
  );
}
