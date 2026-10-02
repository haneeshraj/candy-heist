import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import PlanetLab from './PlanetLab';

// A look at every planet the engine draws: the 11 presets, each layer
// type on its own, and a few built from many. For checking the drawing by
// eye while working on it; it exists in development only.
export const metadata: Metadata = {
  title: 'Planet lab',
  robots: { index: false, follow: false }
};

export default function PlanetLabRoute() {
  if (process.env.NODE_ENV !== 'development') notFound();
  return <PlanetLab />;
}
