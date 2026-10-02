import {
  releaseSchema,
  type Release,
  type Track
} from '@/content/discography/releases';
import { uniqueSlug } from '@/lib/text/slug';
import type { ReleaseFields } from './model';

// Releases as Candy Haven sent them, as the discography pages show them.
//
// Haven sends what a release is; the pages also need where each part of it
// goes. So an album's (or EP's, or compilation's) named tracks get pages of
// their own, unless a single carries the same recording (its ISRC), in
// which case the row goes to the single's page, as the site's own
// catalogue does it by hand.
//
// The covers aren't sent yet: every release shows the placeholder cover,
// and the shelf the placeholder tape, until the artwork has somewhere to
// live online.
//
// Pure: the loader (published.ts) uses it, and so do the tests.

export const PLACEHOLDER_COVER = '/img/discography/placeholder-cover.webp';
export const PLACEHOLDER_TAPE = '/img/discography/placeholder-tape.webp';

/** Shown in a running order while a track is still to be named. */
export const UNNAMED_TRACK = 'Title to come';

/** A release as stored: Haven's fields, its address, and no empty optional fields. */
export type SentRelease = Omit<ReleaseFields, 'subtitle' | 'label'> & {
  subtitle?: string;
  label?: string;
  slug: string;
};

const ONE_TRACK = new Set(['single', 'remix']);

/** The single each recording came out as, by its ISRC. */
function singlesByIsrc(releases: readonly SentRelease[]) {
  const singles = new Map<string, string>();
  for (const release of releases) {
    if (!ONE_TRACK.has(release.kind)) continue;
    const isrc = release.tracks[0]?.isrc;
    if (isrc && !singles.has(isrc)) singles.set(isrc, release.slug);
  }
  return singles;
}

function tracksOf(
  release: SentRelease,
  singles: ReadonlyMap<string, string>
): Track[] {
  const several = release.tracks.length > 1;
  const taken = new Set<string>();
  return release.tracks.map((sent) => {
    const track: Track = { title: sent.title || UNNAMED_TRACK };
    if (sent.duration) track.duration = sent.duration;
    if (sent.artist) track.artist = sent.artist;
    if (sent.featuring?.length) track.featuring = sent.featuring;
    // A one-track release's page is its track's; an unnamed track has none.
    if (!several || !sent.title) return track;
    const single = sent.isrc ? singles.get(sent.isrc) : undefined;
    if (single && single !== release.slug) {
      track.single = single;
    } else {
      track.slug = uniqueSlug(sent.title, taken, 'track');
      taken.add(track.slug);
    }
    return track;
  });
}

/**
 * The releases visitors see, as the pages take them. One that can't be
 * shown (it shouldn't happen: the site checks a release when it's sent) is
 * left out rather than taking the discography down with it.
 */
export function toSiteReleases(releases: readonly SentRelease[]): Release[] {
  const singles = singlesByIsrc(releases);
  return releases.flatMap((release) => {
    const parsed = releaseSchema.safeParse({
      slug: release.slug,
      title: release.title,
      subtitle: release.subtitle,
      kind: release.kind,
      artist: release.artist,
      date: release.date ?? undefined,
      label: release.label,
      cover: {
        src: PLACEHOLDER_COVER,
        alt: `${release.title}: cover art to come`
      },
      tape: PLACEHOLDER_TAPE,
      credits: release.credits,
      tracks: tracksOf(release, singles),
      distribution: release.distribution
    });
    if (parsed.success) return [parsed.data];
    console.error(
      `Release "${release.slug}" can't be shown.`,
      parsed.error.issues
    );
    return [];
  });
}
