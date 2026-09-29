// Candy Heist's social profiles, shared by the footer and the navbar menu.
// `platform` picks the glyph; the label is what assistive tech reads.

export type SocialPlatform = 'instagram' | 'soundcloud' | 'spotify' | 'youtube';

export interface SocialLink {
  platform: SocialPlatform;
  label: string;
  href: string;
}

// Placeholders: platform home pages until the client sends profile URLs.
export const socialLinks: SocialLink[] = [
  {
    platform: 'instagram',
    label: 'Instagram',
    href: 'https://www.instagram.com/'
  },
  {
    platform: 'soundcloud',
    label: 'SoundCloud',
    href: 'https://soundcloud.com/'
  },
  { platform: 'spotify', label: 'Spotify', href: 'https://open.spotify.com/' },
  { platform: 'youtube', label: 'YouTube', href: 'https://www.youtube.com/' }
];
