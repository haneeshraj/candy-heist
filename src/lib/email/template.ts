// The site's emails, drawn like the email on the confirmation page: dark,
// a gilt hairline round the card, the subject in capitals, the words, the
// receipt as label and value, a button when there's somewhere to go, and
// the signature. Tables and inline styles, because that's what mail apps
// draw reliably; every email goes with a plain-text copy of the same words.

export interface EmailContent {
  /** Over everything, in capitals. */
  title: string;
  greeting?: string;
  paragraphs: string[];
  rows?: { label: string; value: string }[];
  button?: { label: string; href: string };
  /** Under the receipt: how to reach Candy, the small print. */
  after?: string[];
  signature: string;
}

const COLOR = {
  page: '#0c0c0c',
  card: '#121110',
  line: 'rgba(210, 169, 97, 0.22)',
  cream: '#ddcfb2',
  text: '#b9ad95',
  quiet: '#8a8071',
  gilt: '#d2a961'
};
const SANS = "Archivo, 'Helvetica Neue', Arial, sans-serif";
const MONO = "'Courier New', Courier, monospace";

export const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const paragraph = (text: string, color = COLOR.text) =>
  `<p style="margin:0 0 16px;font-family:${SANS};font-size:15px;line-height:1.6;color:${color};">${escapeHtml(text)}</p>`;

export function renderEmail(content: EmailContent): {
  html: string;
  text: string;
} {
  const rows = (content.rows ?? [])
    .map(
      (row) => `
        <tr>
          <td style="padding:10px 0;border-top:1px solid ${COLOR.line};font-family:${MONO};font-size:11px;letter-spacing:2px;text-transform:uppercase;color:${COLOR.quiet};vertical-align:top;">${escapeHtml(row.label)}</td>
          <td style="padding:10px 0;border-top:1px solid ${COLOR.line};font-family:${SANS};font-size:14px;color:${COLOR.cream};text-align:right;vertical-align:top;">${escapeHtml(row.value)}</td>
        </tr>`
    )
    .join('');

  const button = content.button
    ? `
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 24px;">
        <tr>
          <td style="border:1px solid ${COLOR.gilt};">
            <a href="${escapeHtml(content.button.href)}" style="display:inline-block;padding:14px 22px;font-family:${MONO};font-size:12px;letter-spacing:3px;text-transform:uppercase;color:${COLOR.gilt};text-decoration:none;">${escapeHtml(content.button.label)}</a>
          </td>
        </tr>
      </table>`
    : '';

  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="color-scheme" content="dark">
    <title>${escapeHtml(content.title)}</title>
  </head>
  <body style="margin:0;padding:0;background-color:${COLOR.page};">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${COLOR.page};">
      <tr>
        <td align="center" style="padding:32px 16px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:${COLOR.card};border:1px solid ${COLOR.line};">
            <tr>
              <td style="padding:36px 32px 32px;">
                <p style="margin:0 0 28px;font-family:${MONO};font-size:11px;letter-spacing:4px;text-transform:uppercase;color:${COLOR.gilt};">Candy Heist</p>
                <p style="margin:0 0 20px;font-family:${SANS};font-size:20px;font-weight:600;letter-spacing:1px;text-transform:uppercase;color:${COLOR.cream};">${escapeHtml(content.title)}</p>
                ${content.greeting ? paragraph(content.greeting, COLOR.cream) : ''}
                ${content.paragraphs.map((text) => paragraph(text)).join('')}
                ${rows ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 24px;border-bottom:1px solid ${COLOR.line};">${rows}</table>` : ''}
                ${button}
                ${(content.after ?? []).map((text) => paragraph(text, COLOR.quiet)).join('')}
                <p style="margin:24px 0 0;font-family:${MONO};font-size:11px;letter-spacing:2px;color:${COLOR.quiet};">${escapeHtml(content.signature)}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  const text = [
    content.title.toUpperCase(),
    '',
    ...(content.greeting ? [content.greeting, ''] : []),
    ...content.paragraphs.flatMap((line) => [line, '']),
    ...(content.rows ?? []).map((row) => `${row.label}: ${row.value}`),
    ...(content.rows?.length ? [''] : []),
    ...(content.button
      ? [`${content.button.label}: ${content.button.href}`, '']
      : []),
    ...(content.after ?? []).flatMap((line) => [line, '']),
    content.signature
  ].join('\n');

  return { html, text };
}
