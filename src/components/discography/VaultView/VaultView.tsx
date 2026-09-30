'use client';

import { useRef } from 'react';
import type { DiscographyCopy } from '@/content/discography/discography';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import type { ReleaseSummary } from '@/lib/discography/summary';
import { ReleaseCard } from '../ReleaseCard';
import styles from './VaultView.module.scss';

interface VaultViewProps {
  copy: DiscographyCopy['page'];
  releases: ReleaseSummary[];
}

// Figma "Discography — Vault view", the page's first view: every cover in
// one grid (four across, two on phones), each rising in as it arrives.
export default function VaultView({ copy, releases }: VaultViewProps) {
  const listRef = useRef<HTMLUListElement | null>(null);
  useScrollReveal(listRef);

  return (
    <ul ref={listRef} className={styles.grid}>
      {releases.map((release, i) => (
        <li key={release.slug} data-reveal>
          <ReleaseCard
            release={release}
            forthcoming={copy.forthcoming}
            priority={i < 4}
          />
        </li>
      ))}
    </ul>
  );
}
