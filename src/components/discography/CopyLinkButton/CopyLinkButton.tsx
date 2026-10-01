'use client';

import { useEffect, useRef, useState } from 'react';
import { CheckIcon, LinkIcon } from '@/components/icons';
import { copyText } from '@/lib/clipboard/copyText';
import { notifySuccess } from '@/lib/toast/notify';
import { IconSquare } from '../IconSquare';
import styles from './CopyLinkButton.module.scss';

interface CopyLinkButtonProps {
  /** The path to copy, made absolute with the site's origin. */
  path: string;
  label: string;
  copiedLabel: string;
}

// How long the square shows its tick.
const SHOWN_MS = 2000;

// Copies the release's share link: the square turns to a tick for a
// moment, and a toast says "Link copied" (assistive tech hears it too).
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
    if (!(await copyText(url))) return;
    notifySuccess(copiedLabel);
    setCopied(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), SHOWN_MS);
  }

  return (
    <span className={styles.wrap}>
      <IconSquare label={label} onClick={copy}>
        {copied ? <CheckIcon /> : <LinkIcon />}
      </IconSquare>
    </span>
  );
}
