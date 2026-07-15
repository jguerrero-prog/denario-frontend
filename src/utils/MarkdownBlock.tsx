// Renders the markdown subset that Denario's backend emits in step descriptions:
// **bold**, numbered lists with nested bullets, plain paragraphs.

import styles from './MarkdownBlock.module.css';

// ── Inline bold ────────────────────────────────────────────────────────────────

function InlineBold({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/);
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith('**') && p.endsWith('**')
          ? <strong key={i}>{p.slice(2, -2)}</strong>
          : <span key={i}>{p}</span>
      )}
    </>
  );
}

// ── Block parser ───────────────────────────────────────────────────────────────

type OlItem  = { text: string; subitems: string[] };
type Block   =
  | { type: 'para'; text: string }
  | { type: 'ol';   items: OlItem[] }
  | { type: 'ul';   items: string[] };

function parseBlocks(md: string): Block[] {
  const lines = md.split('\n');
  const blocks: Block[] = [];
  let i = 0;

  while (i < lines.length) {
    const raw     = lines[i];
    const trimmed = raw.trim();

    if (!trimmed) { i++; continue; }

    // Numbered list item
    if (/^\d+\.\s/.test(trimmed)) {
      const items: OlItem[] = [];
      while (i < lines.length) {
        const t = lines[i].trim();
        const m = t.match(/^\d+\.\s+(.*)/);
        if (!m) break;
        i++;
        const subitems: string[] = [];
        while (i < lines.length) {
          const sub = lines[i].trim();
          const bm  = sub.match(/^[*\-]\s+(.*)/);
          if (bm) { subitems.push(bm[1]); i++; }
          else if (!sub) { i++; break; }
          else break;
        }
        items.push({ text: m[1], subitems });
      }
      blocks.push({ type: 'ol', items });
      continue;
    }

    // Unordered list item
    if (/^[*\-]\s/.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length) {
        const t  = lines[i].trim();
        const bm = t.match(/^[*\-]\s+(.*)/);
        if (bm) { items.push(bm[1]); i++; }
        else if (!t) { i++; break; }
        else break;
      }
      blocks.push({ type: 'ul', items });
      continue;
    }

    // Paragraph — collect consecutive non-list lines
    let text = trimmed;
    i++;
    while (
      i < lines.length &&
      lines[i].trim() &&
      !/^\d+\.\s/.test(lines[i].trim()) &&
      !/^[*\-]\s/.test(lines[i].trim())
    ) {
      text += ' ' + lines[i].trim();
      i++;
    }
    blocks.push({ type: 'para', text });
  }

  return blocks;
}

// ── Component ──────────────────────────────────────────────────────────────────

interface Props {
  text: string;
  className?: string;
}

export function MarkdownBlock({ text, className }: Props) {
  const blocks = parseBlocks(text);
  return (
    <div className={[styles.root, className].filter(Boolean).join(' ')}>
      {blocks.map((block, bi) => {
        if (block.type === 'para') {
          return <p key={bi} className={styles.para}><InlineBold text={block.text} /></p>;
        }
        if (block.type === 'ol') {
          return (
            <ol key={bi} className={styles.ol}>
              {block.items.map((item, ii) => (
                <li key={ii} className={styles.li}>
                  <InlineBold text={item.text} />
                  {item.subitems.length > 0 && (
                    <ul className={styles.ul}>
                      {item.subitems.map((sub, si) => (
                        <li key={si} className={styles.li}><InlineBold text={sub} /></li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ol>
          );
        }
        if (block.type === 'ul') {
          return (
            <ul key={bi} className={styles.ul}>
              {block.items.map((item, ii) => (
                <li key={ii} className={styles.li}><InlineBold text={item} /></li>
              ))}
            </ul>
          );
        }
        return null;
      })}
    </div>
  );
}
