import { NotFoundPage } from '@/components/system/NotFoundPage';
import { systemCopy } from '@/content/site/system';

// Any address the site doesn't have, and any notFound() on the way (an
// unknown release or chapter): the gold vortex and the way back.
export default function NotFound() {
  return <NotFoundPage copy={systemCopy.notFound} />;
}
