'use client';

import Link from 'next/link';
import type { RefObject } from 'react';
import { SigilIcon } from '@/components/icons';
import { useMagnetic } from '@/hooks/useMagnetic';
import styles from './SigilChip.module.scss';
import type { SigilChipProps } from './SigilChip.types';

// Any scheme (https:, mailto:, tel:) means a plain <a>, not a client-side
// route; only http(s) defaults to opening a new tab.
const HAS_SCHEME = /^[a-z][a-z\d+.-]*:/i;
const IS_WEB_URL = /^https?:\/\//i;

export default function SigilChip(props: SigilChipProps) {
  const {
    variant = 'outline',
    size = 'md',
    icon,
    spinIcon,
    magnetic = true,
    children,
    className,
    disabled = false,
    ...native
  } = props;
  const { ref, innerRef } = useMagnetic<HTMLElement, HTMLSpanElement>({
    enabled: magnetic && !disabled
  });

  const glyph = icon === undefined ? <SigilIcon /> : icon;
  const spin = spinIcon ?? icon === undefined;
  const hasLabel = children !== undefined && children !== null;
  const sizes = typeof size === 'string' ? { base: size } : size;

  const rootProps = {
    className: className ? `${styles.chip} ${className}` : styles.chip,
    'data-variant': variant,
    'data-size': sizes.base,
    'data-size-desktop': sizes.desktop,
    'data-icon-only': hasLabel ? undefined : 'true',
    'data-label-only': glyph ? undefined : 'true'
  };

  const content = (
    <span ref={innerRef} className={styles.content}>
      {glyph ? (
        <span className={styles.ring} data-spin={spin ? 'true' : undefined}>
          <span className={styles.glyph}>{glyph}</span>
        </span>
      ) : null}
      {hasLabel ? <span className={styles.label}>{children}</span> : null}
    </span>
  );

  if (typeof native.href === 'string') {
    const { href, external, ...anchorProps } = native;

    if (disabled) {
      return (
        <span
          {...rootProps}
          ref={ref as RefObject<HTMLSpanElement | null>}
          aria-disabled="true"
          aria-label={anchorProps['aria-label']}
        >
          {content}
        </span>
      );
    }

    const newTab = external ?? IS_WEB_URL.test(href);
    const linkProps = {
      ...anchorProps,
      ...rootProps,
      ...(newTab ? { target: '_blank', rel: 'noopener noreferrer' } : null)
    };

    return HAS_SCHEME.test(href) || newTab ? (
      <a
        {...linkProps}
        href={href}
        ref={ref as RefObject<HTMLAnchorElement | null>}
      >
        {content}
      </a>
    ) : (
      <Link
        {...linkProps}
        href={href}
        ref={ref as RefObject<HTMLAnchorElement | null>}
      >
        {content}
      </Link>
    );
  }

  const { type = 'button', ...buttonProps } = native;
  return (
    <button
      {...buttonProps}
      {...rootProps}
      type={type}
      disabled={disabled}
      ref={ref as RefObject<HTMLButtonElement | null>}
    >
      {content}
    </button>
  );
}
