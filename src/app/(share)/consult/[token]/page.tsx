import type { Metadata } from 'next';
import { connection } from 'next/server';
import { ConsultClosed } from '@/components/consult/ConsultClosed';
import { ConsultRoom } from '@/components/consult/ConsultRoom';
import { consultCopy } from '@/content/consult/consult';
import { DatabaseUnavailableError } from '@/lib/db/client';
import { findRoom } from '@/lib/consult/store';
import type { Room } from '@/lib/consult/model';

// A feedback link's page, outside the site's navbar and footer: a track
// Candy shared from Candy Haven, for the producer the link was sent to.
// Made on every visit, since whether the link is still open is a question
// about now. Kept out of search: the link is the only way in, and an
// unreleased track has no business in an index.

export const metadata: Metadata = {
  title: consultCopy.meta.title,
  description: consultCopy.meta.description,
  robots: { index: false, follow: false }
};

async function openRoom(token: string): Promise<Room | null> {
  try {
    return await findRoom(token);
  } catch (error) {
    if (!(error instanceof DatabaseUnavailableError))
      console.error('A feedback link could not be opened.', error);
    return null;
  }
}

export default async function ConsultRoute(
  props: PageProps<'/consult/[token]'>
) {
  await connection();
  const room = await openRoom((await props.params).token);
  // Made per visit: what "open for 3 days" counts from, the same on the
  // server's render and the browser's.
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();
  return room ? (
    <ConsultRoom room={room} copy={consultCopy} renderedAt={now} />
  ) : (
    <ConsultClosed copy={consultCopy.closed} />
  );
}
