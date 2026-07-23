// Inline-only formatting for **bold**, *italic*, `code`, and inline $math$
// spans, plus one block-level pattern for "* "/"- " bullet lines. Methods
// content arrives as schema-constrained structured fields (label/body/points)
// with no freeform block structure, but Referee/Literature bodies are real
// LLM prose that use all of these — without them, a "* item" line, a
// *emphasized* word, or a $\lambda_1 = 3.24$ expression render as literal
// asterisks/dollar signs. Deliberately minimal (no headings/nesting/numbered
// lists — see liteMarkdown.tsx for that richer case, used for agent
// transcript logs). ** is checked before single * in the alternation so a
// bold span isn't split into two italic delimiters.

import styles from './MarkdownBlock.module.css';

interface Props {
  text: string;
  className?: string;
}

export function InlineMarkdown({ text, className }: Props) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`|\$[^$]+\$|\*[^*]+\*)/);
  return (
    <span className={className}>
      {parts.map((p, i) => {
        if (p.startsWith('**') && p.endsWith('**')) {
          return <strong key={i}>{p.slice(2, -2)}</strong>;
        }
        if (p.startsWith('`') && p.endsWith('`')) {
          return <code key={i} className={styles.code}>{p.slice(1, -1)}</code>;
        }
        if (p.startsWith('$') && p.endsWith('$')) {
          return <span key={i} className={styles.math}>{p.slice(1, -1)}</span>;
        }
        if (p.startsWith('*') && p.endsWith('*')) {
          return <em key={i}>{p.slice(1, -1)}</em>;
        }
        return <span key={i}>{p}</span>;
      })}
    </span>
  );
}

type Block = { type: 'p' | 'ul'; lines: string[] };

// A blank line always starts a fresh block, even if the next line's type
// matches the previous block's — otherwise two paragraphs separated by a
// blank line would wrongly merge into one.
function splitBlocks(text: string): Block[] {
  const blocks: Block[] = [];
  let breakPending = false;
  for (const raw of text.split('\n')) {
    if (raw.trim() === '') { breakPending = true; continue; }
    const bullet = raw.match(/^\s*[*-]\s+(.+)$/);
    const type: Block['type'] = bullet ? 'ul' : 'p';
    const line = bullet ? bullet[1] : raw;
    const last = blocks[blocks.length - 1];
    if (!breakPending && last?.type === type) {
      last.lines.push(line);
    } else {
      blocks.push({ type, lines: [line] });
    }
    breakPending = false;
  }
  return blocks;
}

// Block-level rendering for freeform prose: consecutive "* "/"- " lines
// become a <ul>/<li>, everything else stays a <p> — same inline formatting
// as InlineMarkdown either way. className is applied per-block so callers
// keep their existing typography (e.g. RefereeFullPage's .prose/.pointBody).
export function MarkdownBlock({ text, className }: Props) {
  return (
    <>
      {splitBlocks(text).map((block, i) =>
        block.type === 'ul' ? (
          <ul key={i} className={styles.list}>
            {block.lines.map((line, j) => (
              <li key={j} className={className}><InlineMarkdown text={line} /></li>
            ))}
          </ul>
        ) : (
          <p key={i} className={className}><InlineMarkdown text={block.lines.join('\n')} /></p>
        )
      )}
    </>
  );
}
