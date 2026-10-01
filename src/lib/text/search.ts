// Plain text search for the site's lists (the services, the releases):
// a query matches when every one of its words turns up somewhere in what
// the item says about itself, ignoring case, accents and punctuation, so
// "mix master" finds "Mixing & Mastering" and "remix" finds "Remix".

/** Lower case, accents off, anything not a letter or digit a space. */
export function normalizeText(text: string) {
  return text
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

/** The words of a query, normalised; none for a blank one. */
export const searchTerms = (query: string) =>
  normalizeText(query).split(' ').filter(Boolean);

/** True when every term is in one of the fields (or there are none). */
export function matchesSearch(
  fields: readonly (string | null | undefined)[],
  terms: readonly string[]
) {
  if (terms.length === 0) return true;
  const haystack = ` ${normalizeText(fields.filter(Boolean).join(' '))}`;
  return terms.every((term) => haystack.includes(` ${term}`));
}
