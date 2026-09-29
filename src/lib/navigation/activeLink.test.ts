import { describe, expect, it } from 'vitest';
import { findActiveLink } from './activeLink';

const links = [
  { label: 'Home', href: '/' },
  { label: 'Sessions', href: '/sessions' },
  { label: 'Sets', href: '/sets' },
  { label: 'Set list', href: '/sets/list' }
];

describe('findActiveLink', () => {
  it('matches Home only on the root path', () => {
    expect(findActiveLink(links, '/')?.label).toBe('Home');
    expect(findActiveLink(links, '/about')).toBeUndefined();
  });

  it('matches a page and the pages under it', () => {
    expect(findActiveLink(links, '/sessions')?.label).toBe('Sessions');
    expect(findActiveLink(links, '/sessions/')?.label).toBe('Sessions');
    expect(findActiveLink(links, '/sessions/mix')?.label).toBe('Sessions');
  });

  it('does not match a path that only shares a prefix', () => {
    expect(findActiveLink(links, '/sessionsx')).toBeUndefined();
  });

  it('prefers the deepest matching link', () => {
    expect(findActiveLink(links, '/sets/list/2026')?.label).toBe('Set list');
    expect(findActiveLink(links, '/sets/archive')?.label).toBe('Sets');
  });
});
