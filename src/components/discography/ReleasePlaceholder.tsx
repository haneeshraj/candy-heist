import Image from 'next/image';
import { SigilChip } from '@/components/common/SigilChip';
import { ArrowIcon } from '@/components/icons';
import type { Release } from '@/content/discography/releases';
import styles from './Placeholder.module.scss';

// Stand-in for a release's page, opened from the lifted tape on the home
// shelf: its cover, title and artist until the page gets its design.
export default function ReleasePlaceholder({ release }: { release: Release }) {
  return (
    <main className={styles.page}>
      <div className={styles.release}>
        <div className={styles.cover}>
          <Image
            src={release.cover.src}
            alt={release.cover.alt}
            fill
            priority
            sizes="(min-width: 768px) 400px, 100vw"
            className={styles.coverImage}
          />
        </div>
        <div>
          <p className={styles.kicker}>Release</p>
          <h1 className={styles.title}>{release.title}</h1>
          <p className={styles.meta}>{release.artist}</p>
          <p className={styles.note}>
            Placeholder page. The tracklist, player and links arrive with this
            page&rsquo;s design.
          </p>
          <div className={styles.actions}>
            <SigilChip href="/discography" icon={<ArrowIcon />}>
              Discography
            </SigilChip>
          </div>
        </div>
      </div>
    </main>
  );
}
