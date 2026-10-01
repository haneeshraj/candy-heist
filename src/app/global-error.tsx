'use client';

import './globals.scss';
import { ErrorPage } from '@/components/system/ErrorPage';
import { systemCopy } from '@/content/site/system';
import { fontVariables } from './fonts';

// The root layout itself broke, so this draws its own document: the same
// signal-lost screen, with the site's fonts and styles brought in here.
export default function GlobalError({
  error,
  retry
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <html lang="en" className={fontVariables}>
      <body>
        <ErrorPage
          copy={systemCopy.error}
          digest={error.digest}
          onRetry={retry}
        />
      </body>
    </html>
  );
}
