// @vitest-environment node
import { randomBytes } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { readGoogleConfig } from './config';
import { openToken, sealToken } from './tokens';

describe('Candy’s sealed sign-in', () => {
  const key = randomBytes(32);

  it('opens what it sealed, and nothing else', () => {
    const sealed = sealToken('1//refresh-token', key);
    expect(sealed).not.toContain('refresh');
    expect(openToken(sealed, key)).toBe('1//refresh-token');
    expect(() => openToken(sealed, randomBytes(32))).toThrow();
    const [iv, tag, data] = sealed.split('.');
    const tampered = Buffer.from(data, 'base64');
    tampered[0] ^= 1;
    expect(() =>
      openToken([iv, tag, tampered.toString('base64')].join('.'), key)
    ).toThrow();
  });

  it('needs every setting, and a 32-byte key', () => {
    const env = {
      GOOGLE_CLIENT_ID: 'id',
      GOOGLE_CLIENT_SECRET: 'secret',
      GOOGLE_CONNECT_KEY: 'connect',
      GOOGLE_TOKEN_KEY: key.toString('base64')
    };
    expect(readGoogleConfig(env)?.tokenKey.length).toBe(32);
    expect(readGoogleConfig({ ...env, GOOGLE_TOKEN_KEY: 'short' })).toBeNull();
    expect(readGoogleConfig({ ...env, GOOGLE_CONNECT_KEY: ' ' })).toBeNull();
  });
});
