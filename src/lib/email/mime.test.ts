import { describe, expect, it } from 'vitest';
import { buildMime, encodeWord, toRaw } from './mime';
import { escapeHtml, renderEmail } from './template';

const decodePart = (mime: string, type: string) => {
  const part = mime.split(`Content-Type: ${type}; charset=UTF-8`)[1];
  const body = part.split('\r\n\r\n')[1].split('\r\n--')[0];
  return Buffer.from(body.replace(/\r\n/g, ''), 'base64').toString('utf8');
};

describe('mime', () => {
  it('leaves ASCII words alone and encodes the rest', () => {
    expect(encodeWord('Your commission is in')).toBe('Your commission is in');
    const encoded = encodeWord('You’re booked.');
    expect(encoded).toMatch(/^=\?UTF-8\?B\?.+\?=$/);
    expect(Buffer.from(encoded.slice(10, -2), 'base64').toString('utf8')).toBe(
      'You’re booked.'
    );
  });

  it('builds headers and both bodies, each word intact', () => {
    const mime = buildMime(
      {
        from: { name: 'Candy Heist', address: 'candy@example.com' },
        to: { name: 'Zoë, from "Northlight"', address: 'zoe@example.com' },
        subject: 'You’re booked.',
        text: 'Thursday 8 October, 14:00.',
        html: '<p>Thursday 8 October, 14:00.</p>'
      },
      'b0undary'
    );
    expect(mime).toContain('From: "Candy Heist" <candy@example.com>');
    expect(mime).toMatch(/To: =\?UTF-8\?B\?.+\?= <zoe@example.com>/);
    expect(mime).toContain(
      'Content-Type: multipart/alternative; boundary="b0undary"'
    );
    expect(decodePart(mime, 'text/plain')).toBe('Thursday 8 October, 14:00.');
    expect(decodePart(mime, 'text/html')).toBe(
      '<p>Thursday 8 October, 14:00.</p>'
    );
    expect(mime.trimEnd().endsWith('--b0undary--')).toBe(true);
    expect(toRaw(mime)).not.toMatch(/[+/=]/);
  });

  it('refuses an address that would smuggle in a header', () => {
    expect(() =>
      buildMime({
        from: { address: 'candy@example.com' },
        to: { address: 'a@example.com>\r\nBcc: <b@example.com' },
        subject: 'x',
        text: 'x',
        html: 'x'
      })
    ).toThrow();
  });
});

describe('email template', () => {
  it('escapes what people typed, and says the same in plain text', () => {
    const { html, text } = renderEmail({
      title: 'You’re booked.',
      greeting: 'Hi <Alex>,',
      paragraphs: ['A & B'],
      rows: [{ label: 'Reference', value: 'CH-K3P2Q8' }],
      button: { label: 'Join the call', href: 'https://meet.google.com/abc' },
      signature: 'Candy Heist'
    });
    expect(html).toContain('Hi &lt;Alex&gt;,');
    expect(html).toContain('A &amp; B');
    expect(html).toContain('href="https://meet.google.com/abc"');
    expect(text).toContain('Reference: CH-K3P2Q8');
    expect(text).toContain('Join the call: https://meet.google.com/abc');
    expect(escapeHtml(`"'`)).toBe('&quot;&#39;');
  });
});
