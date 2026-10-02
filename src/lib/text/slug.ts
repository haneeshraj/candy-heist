// A title as a URL segment: lowercase words joined by dashes, accents
// dropped, nothing else kept. "Move Yo Body! (Extended Mix)" becomes
// "move-yo-body-extended-mix".

const MAX = 60;

export function slugify(text: string): string {
  return text
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, MAX)
    .replace(/-+$/, '');
}

/**
 * A slug for `text` that none of `taken` already is: its own, or with -2,
 * -3 and so on after it. `fallback` stands in for a title with no letters
 * or digits at all.
 */
export function uniqueSlug(
  text: string,
  taken: ReadonlySet<string>,
  fallback = 'untitled'
): string {
  const base = slugify(text) || fallback;
  if (!taken.has(base)) return base;
  for (let n = 2; ; n++) {
    const candidate = `${base.slice(0, MAX - String(n).length - 1)}-${n}`;
    if (!taken.has(candidate)) return candidate;
  }
}
