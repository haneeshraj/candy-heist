import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import VideoPlayer from './VideoPlayer';
import { chapterAt, chapterSegments, formatTime } from './time';

vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} />
  )
}));

const props = {
  poster: '/poster.jpeg',
  posterAlt: 'The stage',
  eyebrow: 'Sessions',
  title: 'Why one on one',
  duration: '2:14',
  unavailableLabel: 'Intro video coming soon'
};

describe('VideoPlayer', () => {
  beforeEach(() => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    }));
  });

  it('shows the poster with play disabled until there is a video', () => {
    render(<VideoPlayer {...props} src={null} />);
    expect(
      screen.getByRole('region', { name: props.title })
    ).toBeInTheDocument();
    expect(screen.getByAltText(props.posterAlt)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: props.unavailableLabel })
    ).toBeDisabled();
  });

  it('plays the video from the poster button', async () => {
    const play = vi
      .spyOn(HTMLMediaElement.prototype, 'play')
      .mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<VideoPlayer {...props} src="/intro.mp4" />);

    await user.click(
      screen.getByRole('button', { name: `Play: ${props.title}` })
    );
    expect(play).toHaveBeenCalled();
    play.mockRestore();
  });
});

describe('player time helpers', () => {
  it('formats times', () => {
    expect(formatTime(38)).toBe('0:38');
    expect(formatTime(134)).toBe('2:14');
    expect(formatTime(3725)).toBe('1:02:05');
    expect(formatTime(Number.NaN)).toBe('0:00');
  });

  it('splits the timeline into chapters and finds the current one', () => {
    const chapters = [
      { at: 0, label: 'Intro' },
      { at: 21, label: 'The sessions' }
    ];
    expect(chapterSegments(chapters, 60)).toEqual([
      { label: 'Intro', start: 0, end: 21 },
      { label: 'The sessions', start: 21, end: 60 }
    ]);
    expect(chapterAt(chapters, 30)?.label).toBe('The sessions');
    expect(chapterSegments([], 60)).toEqual([{ label: '', start: 0, end: 60 }]);
  });
});
