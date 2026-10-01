import { SigilIcon } from '@/components/icons';
import type { TextBlock, TextRun } from '@/lib/markdown/blocks';
import styles from './ItemStep.module.scss';

// Runs of text in their voices: *emphasis* and **strong**.
function Runs({ runs }: { runs: TextRun[] }) {
  return runs.map(({ text, voice }, i) =>
    voice ? (
      <span
        key={i}
        className={voice === 'emphasis' ? styles.emphasis : styles.strong}
      >
        {text}
      </span>
    ) : (
      text
    )
  );
}

// An item's write-up, from the markdown typed into Candy Haven: the first
// paragraph set large, the rest as text, headings as small mono labels,
// lists with the sigil, and "**Term**: text" lists as a timeline. The first
// paragraph enters with the title; everything after it rises in as it
// scrolls into view, since a write-up can run long.
export default function ItemBody({ blocks }: { blocks: TextBlock[] }) {
  const lede = blocks.findIndex((block) => block.kind === 'paragraph');

  return blocks.map((block, i) => {
    const key = `${block.kind}-${i}`;
    switch (block.kind) {
      case 'paragraph':
        return (
          <p
            key={key}
            className={i === lede ? styles.lede : styles.paragraph}
            {...(i === lede ? { 'data-enter': '' } : { 'data-reveal': '' })}
          >
            <Runs runs={block.runs} />
          </p>
        );
      case 'heading':
        return (
          <h3 key={key} className={styles.blockLabel} data-reveal>
            {block.text}
          </h3>
        );
      case 'quote':
        return (
          <blockquote key={key} className={styles.quote} data-reveal>
            <Runs runs={block.runs} />
          </blockquote>
        );
      case 'list':
        return (
          <ul key={key} className={styles.bullets}>
            {block.items.map((runs, j) => (
              <li key={j} className={styles.bullet} data-reveal>
                <SigilIcon className={styles.bulletSigil} />
                <span>
                  <Runs runs={runs} />
                </span>
              </li>
            ))}
          </ul>
        );
      case 'entries':
        return (
          <ol key={key} className={styles.timeline}>
            {block.items.map((entry) => (
              <li key={entry.term} className={styles.timelineStep} data-reveal>
                <span className={styles.timelineAt}>{entry.term}</span>
                <span className={styles.timelineText}>
                  <Runs runs={entry.runs} />
                </span>
              </li>
            ))}
          </ol>
        );
    }
  });
}
