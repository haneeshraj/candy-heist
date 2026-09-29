// The per-letter text reveals render each letter as its own inline-block,
// and a line can break between any two of those. Grouping the letters of
// each word into one unbreakable span keeps line breaks at the spaces.
// Indices stay the letters' positions in the original text, so per-letter
// refs and staggers are unchanged.

export type LetterGroup =
  | { kind: 'space'; index: number }
  | { kind: 'word'; start: number; chars: string[] };

export function groupWords(letters: string[]): LetterGroup[] {
  const groups: LetterGroup[] = [];
  letters.forEach((char, index) => {
    if (char === ' ') {
      groups.push({ kind: 'space', index });
      return;
    }
    const last = groups[groups.length - 1];
    if (last?.kind === 'word') last.chars.push(char);
    else groups.push({ kind: 'word', start: index, chars: [char] });
  });
  return groups;
}
