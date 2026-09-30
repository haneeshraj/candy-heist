import Image from 'next/image';
import Link from 'next/link';
import { ArrowIcon } from '@/components/icons';
import { releaseHref } from '@/content/discography/links';
import {
  artistLine,
  metaParts,
  type ReleaseSummary
} from '@/lib/discography/summary';
import styles from './ReleaseCard.module.scss';

interface ReleaseCardProps {
  release: ReleaseSummary;
  /** "Forthcoming", for a release that isn't out. */
  forthcoming: string;
  /** The artist line under the title. @default true */
  showArtist?: boolean;
  /** Load the cover first (the grid's first row). */
  priority?: boolean;
  sizes?: string;
}

// Figma "A · Vault": a release as a cover over its title, artists and
// kind. Pointing at it frames the cover in gilt and shows the way in. A
// release that isn't out yet carries the crimson dot.
export default function ReleaseCard({
  release,
  forthcoming,
  showArtist = true,
  priority,
  sizes = '(min-width: 1024px) 294px, 45vw'
}: ReleaseCardProps) {
  const { kind, when, tracks } = metaParts(release, forthcoming);
  return (
    <Link className={styles.card} href={releaseHref(release.slug)}>
      <span className={styles.cover}>
        <Image
          src={release.cover.src}
          alt=""
          fill
          sizes={sizes}
          priority={priority}
          className={styles.image}
        />
        <span className={styles.ring} aria-hidden="true">
          <ArrowIcon />
        </span>
      </span>
      <span className={styles.title}>{release.title}</span>
      {showArtist && (
        <span className={styles.artist}>{artistLine(release)}</span>
      )}
      <span
        className={styles.meta}
        data-forthcoming={release.forthcoming || undefined}
      >
        <span>{kind}</span>
        {when && <span className={styles.part}>{when}</span>}
        {tracks && (
          <span className={`${styles.part} ${styles.tracks}`}>{tracks}</span>
        )}
      </span>
    </Link>
  );
}
