import type { Metadata } from 'next';
import DiscographyPlaceholder from '@/components/discography/DiscographyPlaceholder';
import { releases } from '@/content/discography/releases';

export const metadata: Metadata = {
  title: 'Discography · Candy Heist',
  description: 'Every Candy Heist release.'
};

// Placeholder until the discography page is designed.
export default function DiscographyPage() {
  return <DiscographyPlaceholder releases={releases} />;
}
