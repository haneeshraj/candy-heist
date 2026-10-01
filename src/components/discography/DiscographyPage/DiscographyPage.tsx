'use client';

import { useId, useMemo, useRef, useState, type CSSProperties } from 'react';
import { ClipRevealText } from '@/components/common/ClipRevealText';
import { StarField } from '@/components/common/StarField';
import { WordReveal } from '@/components/common/WordReveal';
import { SigilIcon } from '@/components/icons';
import { useScrollRefresh } from '@/hooks/useScrollRefresh';
import { titleSize } from '@/lib/text/titleSize';
import {
  applyFilters,
  kindCounts,
  releaseYears,
  type Filters,
  type SortKey
} from '@/lib/discography/catalogue';
import { IndexView } from '../IndexView';
import { MonumentView } from '../MonumentView';
import { VaultView } from '../VaultView';
import styles from './DiscographyPage.module.scss';
import type { DiscographyPageProps } from './DiscographyPage.types';
import FilterBar from './FilterBar';
import ReleaseFilterTray from './ReleaseFilterTray';
import {
  useDiscographyQuery,
  type DiscographyView
} from './useDiscographyQuery';

// Figma "Discography page": the headline, then the bar that pins (Filter &
// sort, the search, the view switch) and the releases in the chosen view: the Vault
// (every cover, a grid), the Monument (one release a screen, the rail
// scrolling sideways) or the Index (the titles set as type). The view and
// the filters live in the address, so a filtered view can be shared.
export default function DiscographyPage({
  copy,
  releases
}: DiscographyPageProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const trayId = useId();
  const [trayOpen, setTrayOpen] = useState(false);
  const { query, update } = useDiscographyQuery();
  useScrollRefresh(rootRef);

  const kinds = useMemo(() => kindCounts(releases), [releases]);
  const years = useMemo(() => releaseYears(releases), [releases]);
  const shown = useMemo(
    () => applyFilters(releases, query.filters, query.sort, query.search),
    [releases, query.filters, query.sort, query.search]
  );
  // A new set of releases plays its view's entrance afresh.
  const viewKey = `${query.view}:${shown.map((r) => r.slug).join(',')}`;

  const closeTray = () => {
    setTrayOpen(false);
    buttonRef.current?.focus();
  };
  const onFilters = (filters: Filters) => update({ filters });
  const onSort = (sort: SortKey) => update({ sort });
  const onSearch = (search: string) => update({ search });
  const onView = (view: DiscographyView) => update({ view });

  return (
    <div
      ref={rootRef}
      className={styles.page}
      style={
        {
          '--statement-size': titleSize(copy.statement, 1248, 112),
          '--statement-size-sm': titleSize(copy.statement, 342, 48)
        } as CSSProperties
      }
    >
      <div className={styles.sky} aria-hidden="true">
        <div className={styles.skyPin}>
          <StarField className={styles.stars} />
        </div>
      </div>

      <div className={styles.body}>
        <header className={styles.head}>
          <p className={styles.label}>
            <SigilIcon className={styles.labelGlyph} />
            {copy.label}
          </p>
          <h1 className={styles.heading}>
            <span className={styles.srOnly}>
              {copy.lead} {copy.statement}
            </span>
            <span className={styles.headingVisual} aria-hidden="true">
              <WordReveal
                className={styles.lead}
                text={copy.lead}
                trigger="mount"
                staggerDelay={0.08}
              />
              <ClipRevealText
                className={styles.statement}
                text={copy.statement}
                trigger="mount"
                startDelay={0.25}
              />
            </span>
          </h1>
        </header>

        <FilterBar
          copy={copy}
          filters={query.filters}
          search={query.search}
          view={query.view}
          shown={shown.length}
          total={releases.length}
          trayId={trayId}
          trayOpen={trayOpen}
          buttonRef={buttonRef}
          onToggleTray={() => setTrayOpen((open) => !open)}
          onFilters={onFilters}
          onSearch={onSearch}
          onView={onView}
        />

        <ReleaseFilterTray
          id={trayId}
          open={trayOpen}
          copy={copy.filters}
          filters={query.filters}
          sort={query.sort}
          kinds={kinds}
          years={years}
          shown={shown.length}
          total={releases.length}
          onFilters={onFilters}
          onSort={onSort}
          onClose={closeTray}
        />

        <div className={styles.views}>
          {shown.length === 0 ? (
            <p className={styles.empty}>{copy.filters.empty}</p>
          ) : query.view === 'monument' ? (
            <MonumentView key={viewKey} copy={copy} releases={shown} />
          ) : query.view === 'index' ? (
            <IndexView key={viewKey} copy={copy} releases={shown} />
          ) : (
            <VaultView key={viewKey} copy={copy} releases={shown} />
          )}
        </div>
      </div>
    </div>
  );
}
