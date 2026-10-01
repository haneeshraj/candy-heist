import Icon from './Icon';
import type { IconProps } from './Icon.types';

// Paths match the "Glyph / *" components in the Figma file, centred on the
// 12 × 12 grid (Play is nudged right for optical balance).

export function SigilIcon(props: IconProps) {
  return (
    <Icon
      path="M6 0C6.4 4.2 7.8 5.6 12 6C7.8 6.4 6.4 7.8 6 12C5.6 7.8 4.2 6.4 0 6C4.2 5.6 5.6 4.2 6 0Z"
      {...props}
    />
  );
}

export function PlayIcon(props: IconProps) {
  return <Icon path="M2.3 0.5L11.3 6L2.3 11.5Z" {...props} />;
}

export function PauseIcon(props: IconProps) {
  return <Icon path="M2 1H4.4V11H2Z M7.6 1H10V11H7.6Z" {...props} />;
}

export function ArrowIcon(props: IconProps) {
  return (
    <Icon
      path="M1.05 5.4H8.65L6.05 2.8L6.9 1.95L10.95 6L6.9 10.05L6.05 9.2L8.65 6.6H1.05Z"
      {...props}
    />
  );
}

// The arrow turned round, for going back.
export function ArrowBackIcon(props: IconProps) {
  return (
    <Icon
      path="M10.95 5.4H3.35L5.95 2.8L5.1 1.95L1.05 6L5.1 10.05L5.95 9.2L3.35 6.6H10.95Z"
      {...props}
    />
  );
}

export function ExternalIcon(props: IconProps) {
  return (
    <Icon path="M3 2H10V9H8.8V4.05L2.85 10L2 9.15L7.95 3.2H3Z" {...props} />
  );
}

// ---- Contact glyphs

// An envelope: the flap sits inside the outline's hole, so it fills even-odd.
export function MailIcon(props: IconProps) {
  return (
    <Icon
      path="M0 2H12V10H0Z M1 3V9H11V3Z M1 3L6 6.6L11 3V4.2L6 7.8L1 4.2Z"
      fillRule="evenodd"
      {...props}
    />
  );
}

// A handset.
export function PhoneIcon(props: IconProps) {
  return (
    <Icon
      path="M2.86 5.29C3.7 6.94 5.06 8.29 6.71 9.14L7.99 7.86C8.15 7.7 8.38 7.64 8.58 7.71C9.24 7.93 9.94 8.05 10.67 8.05C10.99 8.05 11.25 8.31 11.25 8.63V10.67C11.25 10.99 10.99 11.25 10.67 11.25C5.19 11.25 0.75 6.81 0.75 1.33C0.75 1.01 1.01 0.75 1.33 0.75H3.38C3.7 0.75 3.96 1.01 3.96 1.33C3.96 2.06 4.07 2.76 4.29 3.42C4.35 3.62 4.31 3.85 4.14 4.01Z"
      {...props}
    />
  );
}

// ---- Player controls

export function VolumeIcon(props: IconProps) {
  return (
    <Icon
      path={[
        'M1 4.2H3.4L6.6 1.6V10.4L3.4 7.8H1Z',
        'M8 3.3L8.7 2.6C9.6 3.4 10.2 4.6 10.2 6C10.2 7.4 9.6 8.6 8.7 9.4L8 8.7C8.7 8.1 9.2 7.1 9.2 6C9.2 4.9 8.7 3.9 8 3.3Z'
      ]}
      {...props}
    />
  );
}

export function MutedIcon(props: IconProps) {
  return (
    <Icon
      path={[
        'M1 4.2H3.4L6.6 1.6V10.4L3.4 7.8H1Z',
        'M7.9 4.6L8.6 3.9L9.8 5.1L11 3.9L11.7 4.6L10.5 5.8L11.7 7L11 7.7L9.8 6.5L8.6 7.7L7.9 7L9.1 5.8Z'
      ]}
      {...props}
    />
  );
}

export function FullscreenIcon(props: IconProps) {
  return (
    <Icon
      path="M1 1H4.5V2.2H2.2V4.5H1Z M7.5 1H11V4.5H9.8V2.2H7.5Z M1 7.5H2.2V9.8H4.5V11H1Z M9.8 7.5H11V11H7.5V9.8H9.8Z"
      {...props}
    />
  );
}

export function ExitFullscreenIcon(props: IconProps) {
  return (
    <Icon
      path="M3.3 1H4.5V4.5H1V3.3H3.3Z M7.5 1H8.7V3.3H11V4.5H7.5Z M1 7.5H4.5V11H3.3V8.7H1Z M7.5 7.5H11V8.7H8.7V11H7.5Z"
      {...props}
    />
  );
}

// The inner rectangle winds the other way, so it cuts the frame's hole.
export function PipIcon(props: IconProps) {
  return (
    <Icon
      path={['M1 2H11V10H1Z M2 3V9H10V3Z', 'M6 5.8H9.2V8.2H6Z']}
      {...props}
    />
  );
}

// ---- Service glyphs, one per session type (Figma "Glyph / Production",
// "DJ", "Feedback" and "Mix"). Each is several shapes, filled separately.

// A dial with its range ticks.
const PRODUCTION_PATHS = [
  'M6.75 6C6.75 6.41 6.41 6.75 6 6.75C5.59 6.75 5.25 6.41 5.25 6C5.25 5.59 5.59 5.25 6 5.25C6.41 5.25 6.75 5.59 6.75 6Z',
  'M9.8 6C9.8 3.9 8.1 2.2 6 2.2C3.9 2.2 2.2 3.9 2.2 6C2.2 8.1 3.9 9.8 6 9.8C8.1 9.8 9.8 8.1 9.8 6ZM10.7 6C10.7 8.6 8.6 10.7 6 10.7C3.4 10.7 1.3 8.6 1.3 6C1.3 3.4 3.4 1.3 6 1.3C8.6 1.3 10.7 3.4 10.7 6Z',
  'M3.38 3.38C3.56 3.21 3.84 3.21 4.02 3.38L6.32 5.68C6.49 5.86 6.49 6.14 6.32 6.32C6.14 6.49 5.86 6.49 5.68 6.32L3.38 4.02C3.21 3.84 3.21 3.56 3.38 3.38Z',
  'M1.58 9.78C1.76 9.61 2.04 9.61 2.22 9.78C2.39 9.96 2.39 10.24 2.22 10.42L1.42 11.22C1.24 11.39 0.96 11.39 0.78 11.22C0.61 11.04 0.61 10.76 0.78 10.58L1.58 9.78Z',
  'M9.78 9.78C9.96 9.61 10.24 9.61 10.42 9.78L11.22 10.58C11.39 10.76 11.39 11.04 11.22 11.22C11.04 11.39 10.76 11.39 10.58 11.22L9.78 10.42C9.61 10.24 9.61 9.96 9.78 9.78Z'
] as const;

// A record and its tonearm.
const DJ_PATHS = [
  'M6.65 6.6C6.65 7.29 6.09 7.85 5.4 7.85C4.71 7.85 4.15 7.29 4.15 6.6C4.15 5.91 4.71 5.35 5.4 5.35C6.09 5.35 6.65 5.91 6.65 6.6Z',
  'M11.7 1.1C11.7 1.54 11.34 1.9 10.9 1.9C10.46 1.9 10.1 1.54 10.1 1.1C10.1 0.66 10.46 0.3 10.9 0.3C11.34 0.3 11.7 0.66 11.7 1.1Z',
  'M9.65 6.6C9.65 4.25 7.75 2.35 5.4 2.35C3.05 2.35 1.15 4.25 1.15 6.6C1.15 8.95 3.05 10.85 5.4 10.85C7.75 10.85 9.65 8.95 9.65 6.6ZM10.55 6.6C10.55 9.44 8.24 11.75 5.4 11.75C2.56 11.75 0.25 9.44 0.25 6.6C0.25 3.76 2.56 1.45 5.4 1.45C8.24 1.45 10.55 3.76 10.55 6.6Z',
  'M10.45 1.1C10.45 0.85 10.65 0.65 10.9 0.65C11.15 0.65 11.35 0.85 11.35 1.1L11.35 4.2C11.35 4.32 11.3 4.44 11.21 4.52L8.41 7.22C8.23 7.4 7.95 7.39 7.78 7.21C7.6 7.03 7.61 6.75 7.79 6.58L10.45 4.01L10.45 1.1Z'
] as const;

// A speech bubble holding a waveform.
const FEEDBACK_PATHS = [
  'M11 1.05C11.25 1.05 11.45 1.25 11.45 1.5L11.45 8.5C11.45 8.75 11.25 8.95 11 8.95L5.38 8.95L2.91 11.32C2.78 11.45 2.59 11.48 2.42 11.41C2.26 11.34 2.15 11.18 2.15 11L2.15 8.95L1 8.95C0.75 8.95 0.55 8.75 0.55 8.5L0.55 1.5C0.55 1.25 0.75 1.05 1 1.05L11 1.05ZM1.45 8.05L2.6 8.05C2.85 8.05 3.05 8.25 3.05 8.5L3.05 9.94L4.89 8.18L4.96 8.12C5.03 8.08 5.11 8.05 5.2 8.05L10.55 8.05L10.55 1.95L1.45 1.95L1.45 8.05Z',
  'M3.35 5.8L3.35 4.2C3.35 3.95 3.55 3.75 3.8 3.75C4.05 3.75 4.25 3.95 4.25 4.2L4.25 5.8C4.25 6.05 4.05 6.25 3.8 6.25C3.55 6.25 3.35 6.05 3.35 5.8Z',
  'M4.85 6.6L4.85 3.4C4.85 3.15 5.05 2.95 5.3 2.95C5.55 2.95 5.75 3.15 5.75 3.4L5.75 6.6C5.75 6.85 5.55 7.05 5.3 7.05C5.05 7.05 4.85 6.85 4.85 6.6Z',
  'M6.35 6L6.35 4C6.35 3.75 6.55 3.55 6.8 3.55C7.05 3.55 7.25 3.75 7.25 4L7.25 6C7.25 6.25 7.05 6.45 6.8 6.45C6.55 6.45 6.35 6.25 6.35 6Z',
  'M7.85 6.9L7.85 3.1C7.85 2.85 8.05 2.65 8.3 2.65C8.55 2.65 8.75 2.85 8.75 3.1L8.75 6.9C8.75 7.15 8.55 7.35 8.3 7.35C8.05 7.35 7.85 7.15 7.85 6.9Z'
] as const;

// Three faders, caps at different heights.
const MIX_PATHS = [
  'M0.9 7.05C0.9 6.88 1.03 6.75 1.2 6.75L3.8 6.75C3.97 6.75 4.1 6.88 4.1 7.05L4.1 8.15C4.1 8.32 3.97 8.45 3.8 8.45L1.2 8.45C1.03 8.45 0.9 8.32 0.9 8.15L0.9 7.05Z',
  'M4.4 3.05C4.4 2.88 4.53 2.75 4.7 2.75L7.3 2.75C7.47 2.75 7.6 2.88 7.6 3.05L7.6 4.15C7.6 4.32 7.47 4.45 7.3 4.45L4.7 4.45C4.53 4.45 4.4 4.32 4.4 4.15L4.4 3.05Z',
  'M7.9 5.05C7.9 4.88 8.03 4.75 8.2 4.75L10.8 4.75C10.97 4.75 11.1 4.88 11.1 5.05L11.1 6.15C11.1 6.32 10.97 6.45 10.8 6.45L8.2 6.45C8.03 6.45 7.9 6.32 7.9 6.15L7.9 5.05Z',
  'M2.2 11L2.2 1C2.2 0.83 2.33 0.7 2.5 0.7C2.67 0.7 2.8 0.83 2.8 1L2.8 11C2.8 11.17 2.67 11.3 2.5 11.3C2.33 11.3 2.2 11.17 2.2 11Z',
  'M5.7 11L5.7 1C5.7 0.83 5.83 0.7 6 0.7C6.17 0.7 6.3 0.83 6.3 1L6.3 11C6.3 11.17 6.17 11.3 6 11.3C5.83 11.3 5.7 11.17 5.7 11Z',
  'M9.2 11L9.2 1C9.2 0.83 9.33 0.7 9.5 0.7C9.67 0.7 9.8 0.83 9.8 1L9.8 11C9.8 11.17 9.67 11.3 9.5 11.3C9.33 11.3 9.2 11.17 9.2 11Z'
] as const;

export function ProductionIcon(props: IconProps) {
  return <Icon path={PRODUCTION_PATHS} {...props} />;
}

export function DjIcon(props: IconProps) {
  return <Icon path={DJ_PATHS} {...props} />;
}

export function FeedbackIcon(props: IconProps) {
  return <Icon path={FEEDBACK_PATHS} {...props} />;
}

export function MixIcon(props: IconProps) {
  return <Icon path={MIX_PATHS} {...props} />;
}

// ---- Social glyphs (Figma "Glyph / Instagram", "SoundCloud", "Spotify"
// and "YouTube"). Spotify's arcs and YouTube's play mark are cut out of a
// single shape, so those two fill even-odd.

const INSTAGRAM_PATHS = [
  'M9.4 3.25C9.4 3.61 9.11 3.9 8.75 3.9C8.39 3.9 8.1 3.61 8.1 3.25C8.1 2.89 8.39 2.6 8.75 2.6C9.11 2.6 9.4 2.89 9.4 3.25Z',
  'M10.3 4.1C10.3 2.77 9.23 1.7 7.9 1.7H4.1C2.77 1.7 1.7 2.77 1.7 4.1V7.9C1.7 9.23 2.77 10.3 4.1 10.3H7.9C9.23 10.3 10.3 9.23 10.3 7.9V4.1ZM11.3 7.9C11.3 9.78 9.78 11.3 7.9 11.3H4.1C2.22 11.3 0.7 9.78 0.7 7.9V4.1C0.7 2.22 2.22 0.7 4.1 0.7H7.9C9.78 0.7 11.3 2.22 11.3 4.1V7.9Z',
  'M7.8 6C7.8 5.01 6.99 4.2 6 4.2C5.01 4.2 4.2 5.01 4.2 6C4.2 6.99 5.01 7.8 6 7.8C6.99 7.8 7.8 6.99 7.8 6ZM8.8 6C8.8 7.55 7.55 8.8 6 8.8C4.45 8.8 3.2 7.55 3.2 6C3.2 4.45 4.45 3.2 6 3.2C7.55 3.2 8.8 4.45 8.8 6Z'
] as const;

// The cloud and its three bars.
const SOUNDCLOUD_PATHS = [
  'M4.5 9.2V4.5C5.2 3.8 6.1 3.4 7.1 3.4C8.9 3.4 10.4 4.7 10.7 6.4C11.4 6.4 12 7 12 7.8C12 8.6 11.4 9.2 10.6 9.2H4.5Z',
  'M0.4 7.3C0.4 7.13 0.53 7 0.7 7H0.85C1.02 7 1.15 7.13 1.15 7.3V8.9C1.15 9.07 1.02 9.2 0.85 9.2H0.7C0.53 9.2 0.4 9.07 0.4 8.9V7.3Z',
  'M1.7 6.1C1.7 5.93 1.83 5.8 2 5.8H2.15C2.32 5.8 2.45 5.93 2.45 6.1V8.9C2.45 9.07 2.32 9.2 2.15 9.2H2C1.83 9.2 1.7 9.07 1.7 8.9V6.1Z',
  'M3 5.1C3 4.93 3.13 4.8 3.3 4.8H3.45C3.62 4.8 3.75 4.93 3.75 5.1V8.9C3.75 9.07 3.62 9.2 3.45 9.2H3.3C3.13 9.2 3 9.07 3 8.9V5.1Z'
] as const;

const SPOTIFY_PATH =
  'M6 0.4C9.09 0.4 11.6 2.91 11.6 6C11.6 9.09 9.09 11.6 6 11.6C2.91 11.6 0.4 9.09 0.4 6C0.4 2.91 2.91 0.4 6 0.4ZM8.14 7.68C6.67 7.12 5.18 7.05 3.69 7.47C3.48 7.53 3.35 7.76 3.42 7.97C3.48 8.18 3.7 8.3 3.91 8.24C5.22 7.87 6.54 7.93 7.86 8.43C8.06 8.51 8.3 8.41 8.37 8.2C8.45 7.99 8.35 7.76 8.14 7.68ZM8.89 5.85C6.92 5.01 5 4.89 3.15 5.54C2.9 5.62 2.77 5.89 2.85 6.14C2.94 6.39 3.21 6.52 3.46 6.44C5.06 5.88 6.74 5.96 8.51 6.72C8.75 6.83 9.03 6.71 9.14 6.47C9.24 6.23 9.13 5.95 8.89 5.85ZM9.53 3.92C7.15 2.79 4.79 2.64 2.51 3.5C2.22 3.61 2.08 3.92 2.19 4.21C2.29 4.49 2.61 4.64 2.89 4.53C4.87 3.79 6.92 3.9 9.07 4.91C9.34 5.04 9.67 4.92 9.8 4.65C9.93 4.37 9.81 4.05 9.53 3.92Z';

const YOUTUBE_PATH =
  'M9.3 2.2C10.57 2.2 11.6 3.23 11.6 4.5V7.5C11.6 8.77 10.57 9.8 9.3 9.8H2.7C1.43 9.8 0.4 8.77 0.4 7.5V4.5C0.4 3.23 1.43 2.2 2.7 2.2H9.3ZM4.9 7.8L8.1 6L4.9 4.2V7.8Z';

export function InstagramIcon(props: IconProps) {
  return <Icon path={INSTAGRAM_PATHS} {...props} />;
}

export function SoundCloudIcon(props: IconProps) {
  return <Icon path={SOUNDCLOUD_PATHS} {...props} />;
}

export function SpotifyIcon(props: IconProps) {
  return <Icon path={SPOTIFY_PATH} fillRule="evenodd" {...props} />;
}

export function YouTubeIcon(props: IconProps) {
  return <Icon path={YOUTUBE_PATH} fillRule="evenodd" {...props} />;
}

// ---- Discography: the other platforms (drawn stand-ins until the official
// marks), the page's view switch, and its small actions

// Two beamed notes.
const APPLE_MUSIC_PATHS = [
  'M0.4 9.8A2 1.6 0 1 0 4.4 9.8A2 1.6 0 1 0 0.4 9.8Z',
  'M7.2 8.6A2 1.6 0 1 0 11.2 8.6A2 1.6 0 1 0 7.2 8.6Z',
  'M3.2 1.6H4.4V9.8H3.2Z',
  'M10 0.4H11.2V8.6H10Z',
  'M3.2 0.4H11.2V2.6H3.2Z'
] as const;

// A row of level bars.
const DEEZER_PATH =
  'M0 8H2V12H0Z M2.5 5H4.5V12H2.5Z M5 2H7V12H5Z M7.5 5H9.5V12H7.5Z M10 0H12V12H10Z';

// Four diamonds, three over one.
const TIDAL_PATH =
  'M0 4.2L2.2 2L4.4 4.2L2.2 6.4Z M3.8 4.2L6 2L8.2 4.2L6 6.4Z M7.6 4.2L9.8 2L12 4.2L9.8 6.4Z M3.8 8L6 5.8L8.2 8L6 10.2Z';

export function AppleMusicIcon(props: IconProps) {
  return <Icon path={APPLE_MUSIC_PATHS} {...props} />;
}

export function DeezerIcon(props: IconProps) {
  return <Icon path={DEEZER_PATH} {...props} />;
}

export function TidalIcon(props: IconProps) {
  return <Icon path={TIDAL_PATH} {...props} />;
}

// Two chain links; each is its own path, so where they cross both fill.
const LINK_PATHS = [
  'M6.19 5.81C5.58 5.21 4.6 5.21 3.99 5.81L2.01 7.79C1.41 8.4 1.41 9.38 2.01 9.99C2.62 10.59 3.6 10.59 4.21 9.99L6.19 8.01C6.79 7.4 6.79 6.42 6.19 5.81ZM7.11 4.9C8.22 6.01 8.22 7.81 7.11 8.93L5.13 10.9C4.01 12.02 2.21 12.02 1.09 10.91C-0.02 9.79 -0.02 7.99 1.09 6.87L3.07 4.89C4.19 3.78 5.99 3.78 7.11 4.9Z',
  'M9.99 2.01C9.38 1.41 8.4 1.41 7.79 2.01L5.81 3.99C5.21 4.6 5.21 5.58 5.81 6.19C6.42 6.79 7.4 6.79 8.01 6.19L9.99 4.21C10.59 3.6 10.59 2.62 9.99 2.01ZM10.91 1.1C12.02 2.21 12.02 4.01 10.91 5.13L8.93 7.1C7.81 8.22 6.01 8.22 4.89 7.11C3.78 5.99 3.78 4.19 4.89 3.07L6.87 1.09C7.99 -0.02 9.79 -0.02 10.91 1.1Z'
] as const;

export function LinkIcon(props: IconProps) {
  return <Icon path={LINK_PATHS} {...props} />;
}

export function CloseIcon(props: IconProps) {
  return (
    <Icon
      path={[
        'M0.56 10.45L10.46 0.56L11.45 1.55L1.55 11.44Z',
        'M1.54 0.56L11.44 10.45L10.45 11.44L0.55 1.55Z'
      ]}
      {...props}
    />
  );
}

// A lens and its handle; the lens's inner circle runs the other way round,
// so it stays open.
export function SearchIcon(props: IconProps) {
  return (
    <Icon
      path={[
        'M5 0.5A4.5 4.5 0 1 1 5 9.5A4.5 4.5 0 1 1 5 0.5ZM5 1.7A3.3 3.3 0 1 0 5 8.3A3.3 3.3 0 1 0 5 1.7Z',
        'M8.15 7.3L11.5 10.65L10.65 11.5L7.3 8.15Z'
      ]}
      {...props}
    />
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <Icon
      path="M0.9 6.3L2.1 5.1L4.5 7.5L9.9 2.1L11.1 3.3L4.5 9.9Z"
      {...props}
    />
  );
}

// The view switch: the grid, one release framed, the list.
export function VaultViewIcon(props: IconProps) {
  return (
    <Icon
      path="M0 0H5V5H0Z M7 0H12V5H7Z M0 7H5V12H0Z M7 7H12V12H7Z"
      {...props}
    />
  );
}

export function MonumentViewIcon(props: IconProps) {
  return (
    <Icon
      path={['M0 0H12V12H0Z M1 1V11H11V1Z', 'M3 3H9V9H3Z']}
      fillRule="evenodd"
      {...props}
    />
  );
}

export function IndexViewIcon(props: IconProps) {
  return (
    <Icon path="M0 1H12V2.5H0Z M0 5.25H12V6.75H0Z M0 9.5H12V11H0Z" {...props} />
  );
}
