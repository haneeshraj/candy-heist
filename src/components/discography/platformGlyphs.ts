import type { ComponentType } from 'react';
import {
  AppleMusicIcon,
  DeezerIcon,
  SoundCloudIcon,
  SpotifyIcon,
  TidalIcon,
  YouTubeIcon,
  type IconProps
} from '@/components/icons';
import type { Platform } from '@/content/discography/releases';

// Each platform's glyph. YouTube Music shares YouTube's.
export const PLATFORM_GLYPH: Record<Platform, ComponentType<IconProps>> = {
  spotify: SpotifyIcon,
  'apple-music': AppleMusicIcon,
  'youtube-music': YouTubeIcon,
  youtube: YouTubeIcon,
  soundcloud: SoundCloudIcon,
  deezer: DeezerIcon,
  tidal: TidalIcon
};
