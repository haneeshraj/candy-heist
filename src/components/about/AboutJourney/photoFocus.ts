import type { CSSProperties } from 'react';
import type { AboutPhoto } from '@/content/about/about';

// A photo's crop: where it centres and how far it's zoomed in (Figma
// crops a stand-in photo closer for a role that has no photo of its own).
export function photoFocus(photo: AboutPhoto): CSSProperties | undefined {
  if (!photo.focus) return undefined;
  const origin = `${photo.focus.x}% ${photo.focus.y}%`;
  return {
    objectPosition: origin,
    transform: `scale(${photo.focus.zoom})`,
    transformOrigin: origin
  };
}
