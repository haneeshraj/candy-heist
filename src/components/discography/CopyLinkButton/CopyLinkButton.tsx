'use client';

import { useEffect, useRef, useState } from 'react';
import { CheckIcon, LinkIcon } from '@/components/icons';
import { IconSquare } from '../IconSquare';
import styles from './CopyLinkButton.module.scss';

interface CopyLinkButtonProps {
  /** The path to copy, made absolute with the site's origin. */
  path: string;
  label: string;
  copiedLabel: string;
}

// How long "Link copied" stays up.
const SHOWN_MS = 2000;

// Copies the release's share link. The square turns to a tick and "Link
// copied" shows above it for a moment; the same words are announced.
export default function CopyLinkButton({
  path,
  label,
  copiedLabel
}: CopyLinkButtonProps) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  async function copy() {
    const url = new URL(path, window.location.origin).toString();
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // No clipboard (an insecure origin, an old browser): fall back to
      // selecting it in a throwaway field.
      const field = document.createElement('textarea');
      field.value = url;
      field.setAttribute('readonly', '');
      field.style.position = 'fixed';
      field.style.opacity = '0';
      document.body.appendChild(field);
      field.select();
      document.execCommand('copy');
      field.remove();
    }
    setCopied(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), SHOWN_MS);
  }

  return (
    <span className={styles.wrap}>
      <IconSquare label={label} onClick={copy}>
        {copied ? <CheckIcon /> : <LinkIcon />}
      </IconSquare>
      <span className={styles.tip} data-shown={copied} role="status">
        {copied ? copiedLabel : ''}
      </span>
    </span>
  );
}
