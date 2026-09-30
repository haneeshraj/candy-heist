'use client';

import { useId, type ComponentType } from 'react';
import {
  IndexViewIcon,
  MonumentViewIcon,
  VaultViewIcon,
  type IconProps
} from '@/components/icons';
import type { DiscographyCopy } from '@/content/discography/discography';
import styles from './DiscographyPage.module.scss';
import type { DiscographyView } from './useDiscographyQuery';

const VIEWS: Array<[DiscographyView, ComponentType<IconProps>]> = [
  ['vault', VaultViewIcon],
  ['monument', MonumentViewIcon],
  ['index', IndexViewIcon]
];

interface ViewSwitchProps {
  copy: DiscographyCopy['page']['views'];
  value: DiscographyView;
  onChange: (view: DiscographyView) => void;
}

// Figma "Discography / View switch": Vault, Monument, Index. Radio
// buttons underneath, so the arrow keys move between them; on phones only
// their glyphs show.
export default function ViewSwitch({ copy, value, onChange }: ViewSwitchProps) {
  const name = useId();
  return (
    <fieldset className={styles.switch}>
      <legend className={styles.srOnly}>{copy.label}</legend>
      {VIEWS.map(([view, Glyph]) => (
        <label key={view} className={styles.segment} data-on={view === value}>
          <input
            className={styles.srOnly}
            type="radio"
            name={name}
            value={view}
            checked={view === value}
            onChange={() => onChange(view)}
          />
          <Glyph className={styles.segmentGlyph} />
          <span className={styles.segmentLabel}>{copy[view]}</span>
        </label>
      ))}
    </fieldset>
  );
}
