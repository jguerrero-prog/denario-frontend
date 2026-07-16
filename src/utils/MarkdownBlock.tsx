// Inline-only formatting for **bold** and `code` spans. Methods content now
// arrives as schema-constrained structured fields (label/body/points), so
// there's no freeform markdown block structure (lists, nesting, headings) left
// to parse here — a field's text is always a single sentence or clause that
// may only contain inline emphasis.

import styles from './MarkdownBlock.module.css';

interface Props {
  text: string;
  className?: string;
}

export function InlineMarkdown({ text, className }: Props) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/);
  return (
    <span className={className}>
      {parts.map((p, i) => {
        if (p.startsWith('**') && p.endsWith('**')) {
          return <strong key={i}>{p.slice(2, -2)}</strong>;
        }
        if (p.startsWith('`') && p.endsWith('`')) {
          return <code key={i} className={styles.code}>{p.slice(1, -1)}</code>;
        }
        return <span key={i}>{p}</span>;
      })}
    </span>
  );
}
