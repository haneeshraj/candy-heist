// @vitest-environment node
import {
  createLocalJWKSet,
  exportJWK,
  generateKeyPair,
  SignJWT,
  type JWTVerifyGetKey
} from 'jose';
import { beforeAll, describe, expect, it } from 'vitest';
import { readHavenAuthConfig, verifyHavenToken } from './auth';

// Real tokens, signed the way Google signs Firebase's, against a key made
// here in place of Google's: everything but the key is checked for real.

const config = {
  projectId: 'candy-haven-test',
  allowedUids: ['candy-uid', 'mist-uid']
};
const now = new Date('2026-10-01T12:00:00.000Z');
const seconds = Math.floor(now.getTime() / 1000);

let keys: JWTVerifyGetKey;
let sign: (claims: Record<string, unknown>, uid?: string) => Promise<string>;
let foreignSign: () => Promise<string>;

beforeAll(async () => {
  const { privateKey, publicKey } = await generateKeyPair('RS256');
  const jwk = {
    ...(await exportJWK(publicKey)),
    kid: 'google-1',
    alg: 'RS256'
  };
  keys = createLocalJWKSet({ keys: [jwk] });

  // The claims a real token carries, then whatever a test changes: set
  // whole rather than through jose's setters, which would put back what a
  // test means to break.
  sign = (claims, uid = 'candy-uid') =>
    new SignJWT({
      iss: `https://securetoken.google.com/${config.projectId}`,
      aud: config.projectId,
      sub: uid,
      iat: seconds - 60,
      exp: seconds + 3000,
      auth_time: seconds - 3600,
      ...claims
    })
      .setProtectedHeader({ alg: 'RS256', kid: 'google-1' })
      .sign(privateKey);

  // Signed by someone who isn't Google: same shape, wrong key.
  const stranger = await generateKeyPair('RS256');
  foreignSign = () =>
    new SignJWT({ auth_time: seconds - 60 })
      .setProtectedHeader({ alg: 'RS256', kid: 'google-1' })
      .setIssuer(`https://securetoken.google.com/${config.projectId}`)
      .setAudience(config.projectId)
      .setSubject('candy-uid')
      .setIssuedAt(seconds - 60)
      .setExpirationTime(seconds + 3000)
      .sign(stranger.privateKey);
});

const verify = (authorization: string | null) =>
  verifyHavenToken(authorization, config, keys, now);

describe('verifyHavenToken', () => {
  it('lets in one of the two accounts with a real, current sign-in', async () => {
    await expect(verify(`Bearer ${await sign({})}`)).resolves.toEqual({
      ok: true,
      uid: 'candy-uid'
    });
  });

  it('refuses a request with no sign-in at all', async () => {
    await expect(verify(null)).resolves.toEqual({ ok: false, status: 401 });
    await expect(verify('Bearer nonsense')).resolves.toEqual({
      ok: false,
      status: 401
    });
  });

  it('refuses a token Google didn’t sign', async () => {
    await expect(verify(`Bearer ${await foreignSign()}`)).resolves.toEqual({
      ok: false,
      status: 401
    });
  });

  it('refuses a token for another project', async () => {
    const token = await sign({ aud: 'someone-elses-project' });
    await expect(verify(`Bearer ${token}`)).resolves.toEqual({
      ok: false,
      status: 401
    });
  });

  it('refuses a token that has run out', async () => {
    const token = await sign({ exp: seconds - 3600 });
    await expect(verify(`Bearer ${token}`)).resolves.toEqual({
      ok: false,
      status: 401
    });
  });

  it('refuses a real sign-in from any other account', async () => {
    const token = await sign({}, 'a-third-account');
    await expect(verify(`Bearer ${token}`)).resolves.toEqual({
      ok: false,
      status: 403
    });
  });
});

describe('readHavenAuthConfig', () => {
  it('reads the project and the allowed accounts', () => {
    expect(
      readHavenAuthConfig({
        FIREBASE_PROJECT_ID: ' candy-haven ',
        HAVEN_ALLOWED_UIDS: 'a, b ,'
      })
    ).toEqual({ projectId: 'candy-haven', allowedUids: ['a', 'b'] });
  });

  it('is missing until both are set', () => {
    expect(readHavenAuthConfig({ FIREBASE_PROJECT_ID: 'x' })).toBeNull();
  });
});
