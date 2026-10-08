import type { NextRequest } from 'next/server';
import { escapeHtml } from '@/lib/email/template';
import { readGoogleConfig, STATE_COOKIE } from '@/lib/google/config';
import { completeConnection } from '@/lib/google/oauth';

// Google sends Candy back here after he signs in. The state has to match
// the cookie set on the way out, so nobody can connect their own account
// in his place. Then a plain page says whose account it is now.

function page(title: string, lines: string[], status = 200) {
  const html = `<!doctype html>
<html lang="en">
  <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escapeHtml(title)}</title></head>
  <body style="margin:0;min-height:100vh;display:grid;place-items:center;background:#0c0c0c;color:#ddcfb2;font-family:Arial,sans-serif;">
    <main style="max-width:520px;padding:32px;border:1px solid rgba(210,169,97,.25);">
      <p style="margin:0 0 16px;font:12px 'Courier New',monospace;letter-spacing:4px;text-transform:uppercase;color:#d2a961;">Candy Heist</p>
      <h1 style="margin:0 0 16px;font-size:22px;">${escapeHtml(title)}</h1>
      ${lines.map((line) => `<p style="line-height:1.6;color:#b9ad95;">${escapeHtml(line)}</p>`).join('')}
    </main>
  </body>
</html>`;
  const response = new Response(html, {
    status,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'no-store'
    }
  });
  return response;
}

export async function GET(request: NextRequest) {
  const config = readGoogleConfig();
  if (!config) return new Response('Not found', { status: 404 });

  const params = request.nextUrl.searchParams;
  const expected = request.cookies.get(STATE_COOKIE)?.value;
  if (params.get('error'))
    return page(
      'Not connected',
      [
        'Google said the sign-in was cancelled. Use the connect link again to try once more.'
      ],
      400
    );
  const code = params.get('code');
  if (!code || !expected || params.get('state') !== expected)
    return page(
      'Not connected',
      [
        'That sign-in had expired, or didn’t start here. Use the connect link again.'
      ],
      400
    );

  const redirectUri = new URL('/api/google/callback', request.nextUrl.origin);
  try {
    const { email, missing } = await completeConnection(
      config,
      code,
      redirectUri.toString()
    );
    const lines = [
      `Bookings now use ${email}: sessions go on its calendar with a Google Meet link, busy times there are taken on the booking page, and receipts are sent from it.`
    ];
    if (missing.length)
      lines.push(
        'Some permissions weren’t ticked, so part of it won’t work. Use the connect link again and allow everything it asks for.'
      );
    const response = page('Connected', lines);
    response.headers.append(
      'set-cookie',
      `${STATE_COOKIE}=; Path=/api/google; Max-Age=0; HttpOnly; SameSite=Lax`
    );
    return response;
  } catch (error) {
    console.error('Google sign-in could not be completed.', error);
    return page(
      'Not connected',
      [
        'Google’s answer couldn’t be used. Use the connect link again in a moment.'
      ],
      502
    );
  }
}
