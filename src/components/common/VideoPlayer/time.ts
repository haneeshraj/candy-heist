import type { VideoChapter } from './VideoPlayer.types';

/** 0:38, 2:14, 1:02:05 */
export function formatTime(seconds: number) {
  const total = Math.max(0, Math.floor(Number.isFinite(seconds) ? seconds : 0));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = String(total % 60).padStart(2, '0');
  return h ? `${h}:${String(m).padStart(2, '0')}:${s}` : `${m}:${s}`;
}

/** The chapter playing at `time`, if any. */
export function chapterAt(chapters: VideoChapter[], time: number) {
  let current: VideoChapter | undefined;
  for (const chapter of chapters) if (chapter.at <= time) current = chapter;
  return current;
}

export interface ChapterSegment {
  label: string;
  start: number;
  end: number;
}

/** Chapters as back-to-back spans of the timeline; one span without any. */
export function chapterSegments(
  chapters: VideoChapter[],
  duration: number
): ChapterSegment[] {
  const sorted = chapters
    .filter((chapter) => chapter.at < duration)
    .sort((a, b) => a.at - b.at);
  if (!sorted.length || duration <= 0)
    return [{ label: '', start: 0, end: Math.max(duration, 0) }];
  if (sorted[0].at > 0) sorted.unshift({ at: 0, label: '' });
  return sorted.map((chapter, i) => ({
    label: chapter.label,
    start: chapter.at,
    end: sorted[i + 1]?.at ?? duration
  }));
}

export const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
