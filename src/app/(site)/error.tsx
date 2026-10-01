'use client';

import { ErrorPage } from '@/components/system/ErrorPage';
import { systemCopy } from '@/content/site/system';

// Something on a page broke: the signal lost, inside the site (the navbar
// and footer stay), with a way to try again.
export default function SiteError({
  error,
  retry
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <ErrorPage copy={systemCopy.error} digest={error.digest} onRetry={retry} />
  );
}
