import { randomBytes, timingSafeEqual } from 'node:crypto';
import { NextResponse, type NextRequest } from 'next/server';
import { readGoogleConfig, STATE_COOKIE } from '@/lib/google/config';
import { consentUrl } from '@/lib/google/oauth';

// Where Candy connects his Google account, once: /api/google/connect?key=…
// (GOOGLE_CONNECT_KEY) sends him to Google to sign in and allow the site
// his free/busy times, his calendar's events and sending email as him.
// Without the key it's a 404, as if there were nothing here.

function sameKey(given: string | null, expected: string) {
  if (!given) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function GET(request: NextRequest) {
  const config = readGoogleConfig();
  if (
    !config ||
    !sameKey(request.nextUrl.searchParams.get('key'), config.connectKey)
  )
    return new Response('Not found', { status: 404 });

  const state = randomBytes(24).toString('base64url');
  const redirectUri = new URL('/api/google/callback', request.nextUrl.origin);
  const response = NextResponse.redirect(
    consentUrl(config, redirectUri.toString(), state)
  );
  response.cookies.set(STATE_COOKIE, state, {
    httpOnly: true,
    secure: request.nextUrl.protocol === 'https:',
    sameSite: 'lax',
    path: '/api/google',
    maxAge: 600
  });
  return response;
}
