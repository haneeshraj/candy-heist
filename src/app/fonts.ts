// The site's fonts, loaded once and shared by the root layout and the
// global error screen (which renders its own document).

import {
  Archivo,
  Archivo_Black,
  Archivo_Narrow,
  Cormorant_Garamond,
  IBM_Plex_Mono
} from 'next/font/google';

const archivo = Archivo({
  subsets: ['latin'],
  variable: '--font-archivo',
  display: 'swap'
});

const archivoBlack = Archivo_Black({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-archivo-black',
  display: 'swap'
});

const archivoNarrow = Archivo_Narrow({
  subsets: ['latin'],
  variable: '--font-archivo-narrow',
  display: 'swap'
});

const ibmPlexMono = IBM_Plex_Mono({
  weight: ['500'],
  subsets: ['latin'],
  variable: '--font-ibm-plex-mono',
  display: 'swap'
});

// Only the italic is used: it's the accent voice in headlines and copy.
const cormorantGaramond = Cormorant_Garamond({
  weight: '400',
  style: 'italic',
  subsets: ['latin'],
  variable: '--font-cormorant-garamond',
  display: 'swap'
});

/** Every font's CSS variable, for the <html> element. */
export const fontVariables = [
  archivo,
  archivoBlack,
  archivoNarrow,
  ibmPlexMono,
  cormorantGaramond
]
  .map((font) => font.variable)
  .join(' ');
