'use client';

import type { CSSProperties } from 'react';
import { Toaster } from 'sonner';
import { CheckIcon, CloseIcon, SigilIcon } from '@/components/icons';
import { TOAST_DURATION } from '@/lib/toast/notify';
import styles from './SiteToaster.module.scss';
import type { SiteToasterProps } from './SiteToaster.types';

// Each kind's mark (Figma "Toast"): a gilt disc with a tick, a crimson
// point in its ring, the sigil in a gilt ring, a turning arc.
const ICONS = {
  success: (
    <span className={styles.mark} data-kind="success">
      <CheckIcon />
    </span>
  ),
  error: (
    <span className={styles.mark} data-kind="error">
      <span className={styles.point} />
    </span>
  ),
  info: (
    <span className={styles.mark} data-kind="info">
      <SigilIcon />
    </span>
  ),
  loading: <span className={styles.mark} data-kind="loading" />,
  close: <CloseIcon className={styles.closeGlyph} />
};

// Where the toasts appear: bottom centre, just above the navbar (16px
// over the pill; on phones, 12px over the bar and the column's width).
// sonner stacks them, swipes them away and announces them; the look is
// all the site's (unstyled).
export default function SiteToaster({ copy }: SiteToasterProps) {
  return (
    <Toaster
      position="bottom-center"
      offset={{ bottom: 'calc(var(--navbar-clearance, 0rem) + 1.6rem)' }}
      mobileOffset={{
        bottom: 'calc(var(--navbar-clearance, 0rem) + 1.2rem)',
        left: '2.4rem',
        right: '2.4rem'
      }}
      gap={10}
      visibleToasts={3}
      duration={TOAST_DURATION}
      closeButton
      icons={ICONS}
      containerAriaLabel={copy.region}
      style={{ '--width': '38rem' } as CSSProperties}
      toastOptions={{
        unstyled: true,
        closeButtonAriaLabel: copy.close,
        classNames: {
          toast: styles.toast,
          error: styles.error,
          icon: styles.icon,
          content: styles.content,
          title: styles.title,
          description: styles.description,
          actionButton: styles.action,
          closeButton: styles.close
        }
      }}
    />
  );
}
