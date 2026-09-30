import type {
  Platform,
  ReleaseKind,
  Track
} from '@/content/discography/releases';

// How the discography's facts read on the page.

export const KIND_LABEL: Record<ReleaseKind, { one: string; many: string }> = {
  album: { one: 'Album', many: 'Albums' },
  ep: { one: 'EP', many: 'EPs' },
  single: { one: 'Single', many: 'Singles' },
  remix: { one: 'Remix', many: 'Remixes' },
  bootleg: { one: 'Bootleg', many: 'Bootlegs' },
  compilation: { one: 'Compilation', many: 'Compilations' }
};

/** The kinds in the order the filters list them. */
export const KIND_ORDER: readonly ReleaseKind[] = [
  'album',
  'ep',
  'single',
  'remix',
  'bootleg',
  'compilation'
];

export const PLATFORM_LABEL: Record<Platform, string> = {
  spotify: 'Spotify',
  'apple-music': 'Apple Music',
  'youtube-music': 'YouTube Music',
  youtube: 'YouTube',
  soundcloud: 'SoundCloud',
  deezer: 'Deezer',
  tidal: 'Tidal'
};

/** What pre-saving is called on each platform. */
export const PRESAVE_LABEL: Partial<Record<Platform, string>> = {
  'apple-music': 'Pre-add'
};

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December'
];

/** "12 May 2025", from "2025-05-12". Written out, so every reader and the
 * server agree on it whatever their locale. */
export function formatDate(date: string) {
  const [y, m, d] = date.split('-').map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

export const trackCount = (n: number) => `${n} ${n === 1 ? 'track' : 'tracks'}`;

const seconds = (duration: string) => {
  const [m, s] = duration.split(':').map(Number);
  return m * 60 + s;
};

/** The running time, "38:24", or null if any track's length isn't known. */
export function totalDuration(tracks: readonly Track[]) {
  if (tracks.some((t) => !t.duration)) return null;
  const total = tracks.reduce((sum, t) => sum + seconds(t.duration!), 0);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = String(total % 60).padStart(2, '0');
  return h ? `${h}:${String(m).padStart(2, '0')}:${s}` : `${m}:${s}`;
}

/** Days, hours, minutes and seconds to go, none below zero. */
export function timeLeft(target: number, now: number) {
  const left = Math.max(0, Math.floor((target - now) / 1000));
  return {
    days: Math.floor(left / 86400),
    hours: Math.floor((left % 86400) / 3600),
    minutes: Math.floor((left % 3600) / 60),
    seconds: left % 60,
    done: left === 0
  };
}
