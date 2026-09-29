'use client';

import Image from 'next/image';
import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent
} from 'react';
import { ClipRevealText } from '@/components/common/ClipRevealText';
import { CornerTicks } from '@/components/common/CornerTicks';
import { Rings } from '@/components/common/Rings';
import { WordReveal } from '@/components/common/WordReveal';
import {
  ExitFullscreenIcon,
  FullscreenIcon,
  MutedIcon,
  PauseIcon,
  PipIcon,
  PlayIcon,
  VolumeIcon
} from '@/components/icons';
import { chapterAt, chapterSegments, clamp01, formatTime } from './time';
import styles from './VideoPlayer.module.scss';
import type { VideoPlayerProps } from './VideoPlayer.types';

// The site's own video player (Figma "Media / Video player"): a poster with
// a ringed play button, then a chaptered scrub bar and a slim control row
// that fades out while the video plays and the pointer rests. Keyboard:
// space / K play, J / L or ← / → skip, M mute, F fullscreen, C captions.

type Phase = 'poster' | 'playing' | 'paused' | 'ended';

const SPEEDS = [1, 1.25, 1.5, 2, 0.75];
const SKIP_SECONDS = 10;
const IDLE_MS = 2600;

const noSubscribe = () => () => {};
const subscribeFullscreen = (onChange: () => void) => {
  document.addEventListener('fullscreenchange', onChange);
  return () => document.removeEventListener('fullscreenchange', onChange);
};

export default function VideoPlayer({
  src,
  poster,
  posterAlt,
  eyebrow,
  title,
  duration: durationLabel,
  chapters = [],
  captions,
  unavailableLabel,
  playLabel,
  sizes = '100vw',
  priority = false,
  className
}: VideoPlayerProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const idleTimer = useRef<number | undefined>(undefined);

  const [phase, setPhase] = useState<Phase>('poster');
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [captionsOn, setCaptionsOn] = useState(true);
  const [idle, setIdle] = useState(false);
  const [hover, setHover] = useState<number | null>(null);
  const [scrubbing, setScrubbing] = useState(false);

  const supportsPip = useSyncExternalStore(
    noSubscribe,
    () => document.pictureInPictureEnabled === true,
    () => false
  );
  const fullscreen = useSyncExternalStore(
    subscribeFullscreen,
    () => document.fullscreenElement !== null,
    () => false
  );

  const playable = Boolean(src);
  const started = phase !== 'poster';
  const segments = chapterSegments(chapters, duration);
  const chapter = chapterAt(chapters, time);

  useEffect(() => () => window.clearTimeout(idleTimer.current), []);

  // Any pointer or key activity shows the controls; they hide again after
  // a pause in activity while the video is playing.
  function wake() {
    setIdle(false);
    window.clearTimeout(idleTimer.current);
    idleTimer.current = window.setTimeout(() => {
      if (videoRef.current && !videoRef.current.paused) setIdle(true);
    }, IDLE_MS);
  }

  function togglePlay() {
    const video = videoRef.current;
    if (!video || !playable) return;
    if (video.paused || video.ended) void video.play();
    else video.pause();
    wake();
  }

  function seekTo(seconds: number) {
    const video = videoRef.current;
    if (!video || !duration) return;
    video.currentTime = Math.min(duration, Math.max(0, seconds));
    setTime(video.currentTime);
  }

  const fractionAt = (clientX: number) => {
    const rect = trackRef.current?.getBoundingClientRect();
    return rect && rect.width ? clamp01((clientX - rect.left) / rect.width) : 0;
  };

  function onTrackDown(event: PointerEvent<HTMLDivElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    setScrubbing(true);
    seekTo(fractionAt(event.clientX) * duration);
  }

  function onTrackMove(event: PointerEvent<HTMLDivElement>) {
    const fraction = fractionAt(event.clientX);
    setHover(fraction);
    if (scrubbing) seekTo(fraction * duration);
  }

  function onTrackUp(event: PointerEvent<HTMLDivElement>) {
    event.currentTarget.releasePointerCapture(event.pointerId);
    setScrubbing(false);
  }

  function toggleMute() {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    if (!video.muted && video.volume === 0) video.volume = 0.6;
  }

  function changeVolume(value: number) {
    const video = videoRef.current;
    if (!video) return;
    video.volume = value;
    video.muted = value === 0;
  }

  function cycleSpeed() {
    const video = videoRef.current;
    if (!video) return;
    video.playbackRate = SPEEDS[(SPEEDS.indexOf(speed) + 1) % SPEEDS.length];
  }

  function toggleCaptions() {
    const track = videoRef.current?.textTracks[0];
    if (!track) return;
    const next = !captionsOn;
    track.mode = next ? 'showing' : 'hidden';
    setCaptionsOn(next);
  }

  function toggleFullscreen() {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void rootRef.current?.requestFullscreen?.();
  }

  function togglePip() {
    const video = videoRef.current;
    if (!video) return;
    if (document.pictureInPictureElement) void document.exitPictureInPicture();
    else void video.requestPictureInPicture();
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (!started) return;
    const target = event.target as HTMLElement;
    if (target.tagName === 'INPUT') return;
    const key = event.key.toLowerCase();
    const actions: Record<string, () => void> = {
      ' ': togglePlay,
      k: togglePlay,
      j: () => seekTo(time - SKIP_SECONDS),
      l: () => seekTo(time + SKIP_SECONDS),
      arrowleft: () => seekTo(time - 5),
      arrowright: () => seekTo(time + 5),
      m: toggleMute,
      f: toggleFullscreen,
      c: toggleCaptions
    };
    // Buttons already activate on space; don't double up.
    if (key === ' ' && target.tagName === 'BUTTON') return;
    const action = actions[key];
    if (!action) return;
    event.preventDefault();
    action();
    wake();
  }

  const posterLabel = playable
    ? phase === 'ended'
      ? 'Watch again'
      : (playLabel ?? `Watch the intro · ${durationLabel}`)
    : unavailableLabel;
  const shownDuration = duration ? formatTime(duration) : durationLabel;

  return (
    <div
      ref={rootRef}
      className={className ? `${styles.player} ${className}` : styles.player}
      data-phase={phase}
      data-idle={idle && phase === 'playing' ? 'true' : undefined}
      role="region"
      aria-label={title}
      onPointerMove={started ? wake : undefined}
      onKeyDown={onKeyDown}
    >
      <div className={styles.media}>
        <div className={styles.poster} data-motion="poster">
          <Image
            src={poster}
            alt={posterAlt}
            fill
            sizes={sizes}
            preload={priority}
            className={styles.posterImage}
          />
        </div>
        {src ? (
          <video
            ref={videoRef}
            className={styles.video}
            src={src}
            preload="metadata"
            playsInline
            onClick={togglePlay}
            onPlay={() => {
              setPhase('playing');
              wake();
            }}
            onPause={(event) => {
              if (!event.currentTarget.ended) setPhase('paused');
              setIdle(false);
            }}
            onEnded={() => {
              setPhase('ended');
              setIdle(false);
            }}
            onTimeUpdate={(event) => {
              if (!scrubbing) setTime(event.currentTarget.currentTime);
            }}
            onLoadedMetadata={(event) =>
              setDuration(event.currentTarget.duration)
            }
            onDurationChange={(event) =>
              setDuration(event.currentTarget.duration)
            }
            onProgress={(event) => {
              const ranges = event.currentTarget.buffered;
              if (ranges.length) setBuffered(ranges.end(ranges.length - 1));
            }}
            onVolumeChange={(event) => {
              setVolume(event.currentTarget.volume);
              setMuted(event.currentTarget.muted);
            }}
            onRateChange={(event) => setSpeed(event.currentTarget.playbackRate)}
          >
            {captions ? (
              <track
                kind="captions"
                src={captions.src}
                srcLang={captions.srcLang}
                label={captions.label}
                default
              />
            ) : null}
          </video>
        ) : null}
      </div>

      <span className={styles.shade} aria-hidden="true" />
      <CornerTicks inset={-28} className={styles.ticks} />

      <div className={styles.head}>
        <div className={styles.titleBlock}>
          <ClipRevealText
            as="p"
            className={styles.eyebrow}
            text={eyebrow}
            trigger="inView"
            wipeColor="var(--color-gilt)"
          />
          <WordReveal
            as="p"
            className={styles.title}
            text={title}
            trigger="inView"
            startDelay={0.3}
          />
        </div>
        <div className={styles.badges} aria-hidden="true">
          <span className={styles.badge}>HD</span>
          <span className={styles.badge}>{shownDuration}</span>
        </div>
      </div>

      {phase === 'poster' || phase === 'ended' ? (
        <div className={styles.cover}>
          <Rings className={styles.rings} />
          <button
            type="button"
            className={styles.bigPlay}
            onClick={togglePlay}
            disabled={!playable}
            aria-label={playable ? `Play: ${title}` : unavailableLabel}
          >
            <span className={styles.bigPlayRing} aria-hidden="true" />
            <PlayIcon className={styles.bigPlayIcon} />
          </button>
          <p className={styles.coverLabel} aria-hidden="true">
            {posterLabel}
          </p>
        </div>
      ) : null}

      {started ? (
        <div className={styles.controls}>
          <div
            ref={trackRef}
            className={styles.track}
            role="slider"
            tabIndex={0}
            aria-label="Seek"
            aria-valuemin={0}
            aria-valuemax={Math.round(duration)}
            aria-valuenow={Math.round(time)}
            aria-valuetext={`${formatTime(time)} of ${formatTime(duration)}${chapter?.label ? `, ${chapter.label}` : ''}`}
            onPointerDown={onTrackDown}
            onPointerMove={onTrackMove}
            onPointerUp={onTrackUp}
            onPointerLeave={() => setHover(null)}
            onKeyDown={(event) => {
              const steps: Record<string, number> = {
                ArrowLeft: time - 5,
                ArrowRight: time + 5,
                Home: 0,
                End: duration
              };
              if (event.key in steps) {
                event.preventDefault();
                event.stopPropagation();
                seekTo(steps[event.key]);
              }
            }}
          >
            {segments.map((segment) => {
              const length = segment.end - segment.start || 1;
              return (
                <span
                  key={segment.start}
                  className={styles.segment}
                  style={{ flexGrow: length }}
                >
                  <span
                    className={styles.buffered}
                    style={{
                      transform: `scaleX(${clamp01((buffered - segment.start) / length)})`
                    }}
                  />
                  <span
                    className={styles.played}
                    style={{
                      transform: `scaleX(${clamp01((time - segment.start) / length)})`
                    }}
                  />
                </span>
              );
            })}
            <span
              className={styles.playhead}
              style={{ left: `${duration ? (time / duration) * 100 : 0}%` }}
              aria-hidden="true"
            />
            {hover !== null && duration ? (
              <span
                className={styles.tooltip}
                style={{ left: `${hover * 100}%` }}
                aria-hidden="true"
              >
                {formatTime(hover * duration)}
                {chapterAt(chapters, hover * duration)?.label
                  ? ` · ${chapterAt(chapters, hover * duration)?.label}`
                  : ''}
              </span>
            ) : null}
          </div>

          <div className={styles.buttons}>
            <div className={styles.group}>
              <button
                type="button"
                className={styles.button}
                onClick={togglePlay}
                aria-label={phase === 'playing' ? 'Pause' : 'Play'}
              >
                {phase === 'playing' ? <PauseIcon /> : <PlayIcon />}
              </button>
              <button
                type="button"
                className={`${styles.button} ${styles.textButton} ${styles.skip}`}
                onClick={() => seekTo(time - SKIP_SECONDS)}
                aria-label={`Back ${SKIP_SECONDS} seconds`}
              >
                −10
              </button>
              <button
                type="button"
                className={`${styles.button} ${styles.textButton} ${styles.skip}`}
                onClick={() => seekTo(time + SKIP_SECONDS)}
                aria-label={`Forward ${SKIP_SECONDS} seconds`}
              >
                +10
              </button>
              <div className={styles.volume}>
                <button
                  type="button"
                  className={styles.button}
                  onClick={toggleMute}
                  aria-label={muted ? 'Unmute' : 'Mute'}
                  aria-pressed={muted}
                >
                  {muted || volume === 0 ? <MutedIcon /> : <VolumeIcon />}
                </button>
                <input
                  type="range"
                  className={styles.volumeRange}
                  min={0}
                  max={1}
                  step={0.05}
                  value={muted ? 0 : volume}
                  onChange={(event) => changeVolume(Number(event.target.value))}
                  aria-label="Volume"
                  style={
                    {
                      '--level': `${(muted ? 0 : volume) * 100}%`
                    } as CSSProperties
                  }
                />
              </div>
              <p className={styles.time}>
                {formatTime(time)} / {formatTime(duration)}
              </p>
              {chapter?.label ? (
                <p className={styles.chapter}>· {chapter.label}</p>
              ) : null}
            </div>

            <div className={styles.group}>
              {captions ? (
                <button
                  type="button"
                  className={`${styles.button} ${styles.textButton}`}
                  onClick={toggleCaptions}
                  aria-label="Captions"
                  aria-pressed={captionsOn}
                  data-on={captionsOn ? 'true' : undefined}
                >
                  CC
                </button>
              ) : null}
              <button
                type="button"
                className={`${styles.button} ${styles.textButton}`}
                onClick={cycleSpeed}
                aria-label={`Playback speed, ${speed} times`}
              >
                {speed}×
              </button>
              {supportsPip ? (
                <button
                  type="button"
                  className={`${styles.button} ${styles.pip}`}
                  onClick={togglePip}
                  aria-label="Picture in picture"
                >
                  <PipIcon />
                </button>
              ) : null}
              <button
                type="button"
                className={styles.button}
                onClick={toggleFullscreen}
                aria-label={fullscreen ? 'Exit full screen' : 'Full screen'}
              >
                {fullscreen ? <ExitFullscreenIcon /> : <FullscreenIcon />}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
