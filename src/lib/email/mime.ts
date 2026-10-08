// An email as the raw message Gmail's API sends: headers, then the same
// words as plain text and as HTML, so every mail app shows one of them.
// Anything outside ASCII (a curly apostrophe in a subject, an accented
// name) is encoded the way mail headers allow (RFC 2047), and the bodies
// go as base64 lines, so nothing is mangled on the way.

export interface Address {
  name?: string;
  address: string;
}

export interface MailMessage {
  from: Address;
  to: Address;
  replyTo?: Address;
  subject: string;
  text: string;
  html: string;
}

const ASCII = /^[\x20-\x7e]*$/;

/** A header word, as is when it's plain ASCII, else encoded. */
export function encodeWord(value: string): string {
  if (ASCII.test(value)) return value;
  return `=?UTF-8?B?${Buffer.from(value, 'utf8').toString('base64')}?=`;
}

// A name with commas or quotes in it has to be quoted to stay one name.
function formatAddress({ name, address }: Address): string {
  if (/[\r\n<>]/.test(address)) throw new Error('Not an email address.');
  if (!name) return `<${address}>`;
  const clean = name.replace(/[\r\n]+/g, ' ').trim();
  const phrase = ASCII.test(clean)
    ? `"${clean.replace(/["\\]/g, '\\$&')}"`
    : encodeWord(clean);
  return `${phrase} <${address}>`;
}

const base64Lines = (value: string) =>
  (
    Buffer.from(value, 'utf8')
      .toString('base64')
      .match(/.{1,76}/g) ?? []
  ).join('\r\n');

export function buildMime(message: MailMessage, boundary?: string): string {
  const mark =
    boundary ?? `candy-heist-${Math.random().toString(36).slice(2, 14)}`;
  const headers = [
    `From: ${formatAddress(message.from)}`,
    `To: ${formatAddress(message.to)}`,
    message.replyTo ? `Reply-To: ${formatAddress(message.replyTo)}` : null,
    `Subject: ${encodeWord(message.subject.replace(/[\r\n]+/g, ' '))}`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/alternative; boundary="${mark}"`
  ].filter(Boolean);

  const part = (type: string, body: string) =>
    [
      `--${mark}`,
      `Content-Type: ${type}; charset=UTF-8`,
      'Content-Transfer-Encoding: base64',
      '',
      base64Lines(body)
    ].join('\r\n');

  return [
    ...headers,
    '',
    part('text/plain', message.text),
    part('text/html', message.html),
    `--${mark}--`,
    ''
  ].join('\r\n');
}

/** The raw message as Gmail's API takes it: base64url. */
export const toRaw = (mime: string) =>
  Buffer.from(mime, 'utf8').toString('base64url');
