/**
 * Fills a copy template's `{placeholders}`: fill('{shown} of {total}',
 * { shown: 8, total: 14 }) is "8 of 14". A placeholder with no value is
 * left as it is, so a missing one shows up instead of vanishing.
 */
export function fill(
  template: string,
  values: Record<string, string | number>
) {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? String(values[key]) : match
  );
}
