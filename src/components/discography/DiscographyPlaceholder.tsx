import Image from 'next/image';
import Link from 'next/link';
import { releaseHref, type Release } from '@/content/discography/releases';
import styles from './Placeholder.module.scss';

// Stand-in for the discography page, where the home section's button goes:
// every release, each linking to its (placeholder) page.
export default function DiscographyPlaceholder({
  releases
}: {
  releases: Release[];
}) {
  return (
    <main className={styles.page}>
      <p className={styles.kicker}>Discography</p>
      <h1 className={styles.title}>The archive</h1>
      <p className={styles.note}>
        Placeholder page, with dummy releases, until the discography page gets
        its design.
      </p>
      <ul className={styles.grid}>
        {releases.map((release) => (
          <li key={release.slug}>
            <Link className={styles.item} href={releaseHref(release.slug)}>
              <span className={styles.cover}>
                <Image
                  src={release.cover.src}
                  alt={release.cover.alt}
                  fill
                  sizes="(min-width: 1024px) 240px, 45vw"
                  className={styles.coverImage}
                />
              </span>
              <p className={styles.itemTitle}>{release.title}</p>
              <p className={styles.itemArtist}>{release.artist}</p>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
