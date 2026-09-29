// Which navigation link is the page you're on: an exact match, or the
// deepest link the path sits under (/sessions for /sessions/anything).
// Home only ever matches itself, or every page would count as Home.

function trimSlash(path: string): string {
  return path.length > 1 ? path.replace(/\/+$/, '') : path;
}

export function findActiveLink<T extends { href: string }>(
  links: readonly T[],
  pathname: string
): T | undefined {
  const path = trimSlash(pathname);
  let best: T | undefined;
  let bestLength = -1;

  for (const link of links) {
    const href = trimSlash(link.href);
    const matches =
      href === '/'
        ? path === '/'
        : path === href || path.startsWith(`${href}/`);
    if (matches && href.length > bestLength) {
      best = link;
      bestLength = href.length;
    }
  }

  return best;
}
