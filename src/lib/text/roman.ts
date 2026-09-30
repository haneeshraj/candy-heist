const NUMERALS: Array<[number, string]> = [
  [1000, 'M'],
  [900, 'CM'],
  [500, 'D'],
  [400, 'CD'],
  [100, 'C'],
  [90, 'XC'],
  [50, 'L'],
  [40, 'XL'],
  [10, 'X'],
  [9, 'IX'],
  [5, 'V'],
  [4, 'IV'],
  [1, 'I']
];

// A whole number from 1 up as a Roman numeral: 4 → "IV", 12 → "XII".
// Chapters are numbered from their place in the list, so a new one gets
// its numeral for free.
export function toRoman(n: number): string {
  if (!Number.isInteger(n) || n < 1)
    throw new RangeError(`No numeral for ${n}`);
  let rest = n;
  let out = '';
  for (const [value, numeral] of NUMERALS)
    while (rest >= value) {
      out += numeral;
      rest -= value;
    }
  return out;
}
