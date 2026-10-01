import { describe, expect, it } from 'vitest';
import { siteOrigin } from './url';

const env = (vars: Record<string, string>) => vars as NodeJS.ProcessEnv;

const vercel = {
  NODE_ENV: 'production',
  VERCEL_URL: 'candy-heist-abc123.vercel.app',
  VERCEL_PROJECT_PRODUCTION_URL: 'candy-heist.vercel.app'
};

describe('siteOrigin', () => {
  it('takes the address set for the deployment first', () => {
    expect(
      siteOrigin(
        env({ ...vercel, NEXT_PUBLIC_SITE_URL: 'https://candy-heist.com' })
      )
    ).toBe('https://candy-heist.com');
  });

  it('is the local server in development, on whatever port', () => {
    expect(siteOrigin(env({ NODE_ENV: 'development' }))).toBe(
      'http://localhost:3000'
    );
    expect(siteOrigin(env({ NODE_ENV: 'development', PORT: '3100' }))).toBe(
      'http://localhost:3100'
    );
  });

  it('uses Vercel’s production domain in production', () => {
    expect(siteOrigin(env({ ...vercel, VERCEL_ENV: 'production' }))).toBe(
      'https://candy-heist.vercel.app'
    );
  });

  it('gives a preview its own address', () => {
    expect(
      siteOrigin(
        env({
          ...vercel,
          VERCEL_ENV: 'preview',
          VERCEL_BRANCH_URL: 'candy-heist-git-footer.vercel.app'
        })
      )
    ).toBe('https://candy-heist-git-footer.vercel.app');
  });

  it('is the local server for a build off Vercel', () => {
    expect(siteOrigin(env({ NODE_ENV: 'production' }))).toBe(
      'http://localhost:3000'
    );
  });
});
