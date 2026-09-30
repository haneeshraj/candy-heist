import { ArrowIcon } from '@/components/icons';
import type { Platform } from '@/content/discography/releases';
import { PLATFORM_LABEL } from '@/lib/discography/format';
import { PLATFORM_GLYPH } from '../platformGlyphs';
import styles from './SharePage.module.scss';

interface PlatformButtonProps {
  platform: Platform;
  href: string;
  /** "Pre-save", "Pre-add": shown on the right. Left out once it's out. */
  action?: string;
  /** The first, main one: filled gilt. */
  solid?: boolean;
}

// Figma "Share / Platform button": the platform's glyph in a ring and its
// name, full width. Once the release is out the two sit centred; before,
// the action (Pre-save) takes the right.
export default function PlatformButton({
  platform,
  href,
  action,
  solid
}: PlatformButtonProps) {
  const Glyph = PLATFORM_GLYPH[platform];
  return (
    <a
      className={styles.button}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      data-solid={solid || undefined}
      data-split={action ? true : undefined}
    >
      <span className={styles.buttonStart}>
        <span className={styles.ring}>
          <Glyph className={styles.ringGlyph} />
        </span>
        <span className={styles.buttonName}>{PLATFORM_LABEL[platform]}</span>
      </span>
      {action && (
        <span className={styles.buttonAction}>
          {action}
          <ArrowIcon className={styles.buttonArrow} />
        </span>
      )}
      <span className={styles.srOnly}> (opens in a new tab)</span>
    </a>
  );
}
