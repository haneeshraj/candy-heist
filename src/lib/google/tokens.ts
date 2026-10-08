import 'server-only';
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { getDb } from '@/lib/db/client';
import { COLLECTIONS, type GoogleAccountDocument } from '@/lib/db/collections';

// Candy's Google sign-in, kept in the database so he can connect from the
// site rather than anyone copying a token into the host's settings. The
// refresh token is encrypted (AES-256-GCM, GOOGLE_TOKEN_KEY), so the
// database alone never hands out access to his account.

export interface GoogleConnection {
  email: string;
  refreshToken: string;
  scope: string;
}

export function sealToken(token: string, key: Buffer): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const data = Buffer.concat([cipher.update(token, 'utf8'), cipher.final()]);
  return [iv, cipher.getAuthTag(), data]
    .map((part) => part.toString('base64'))
    .join('.');
}

export function openToken(sealed: string, key: Buffer): string {
  const [iv, tag, data] = sealed
    .split('.')
    .map((part) => Buffer.from(part, 'base64'));
  const decipher = createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString(
    'utf8'
  );
}

const ACCOUNT_ID = 'candy';

export async function saveConnection(
  connection: GoogleConnection,
  key: Buffer
): Promise<void> {
  const db = await getDb();
  await db
    .collection<GoogleAccountDocument>(COLLECTIONS.googleAccount)
    .updateOne(
      { _id: ACCOUNT_ID },
      {
        $set: {
          email: connection.email,
          refreshToken: sealToken(connection.refreshToken, key),
          scope: connection.scope,
          connectedAt: new Date()
        }
      },
      { upsert: true }
    );
}

/** The connected account, or null while Candy hasn't signed in. */
export async function loadConnection(
  key: Buffer
): Promise<GoogleConnection | null> {
  const db = await getDb();
  const found = await db
    .collection<GoogleAccountDocument>(COLLECTIONS.googleAccount)
    .findOne({ _id: ACCOUNT_ID });
  if (!found) return null;
  return {
    email: found.email,
    refreshToken: openToken(found.refreshToken, key),
    scope: found.scope
  };
}
