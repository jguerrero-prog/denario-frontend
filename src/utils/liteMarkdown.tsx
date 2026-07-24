import styles from './liteMarkdown.module.css';

// A bounded, hand-rolled markdown/LaTeX renderer — no markdown/LaTeX library
// exists in this project. Handles what cmbagent's various agents (idea_maker/
// idea_hater, planner/plan_reviewer, researcher) actually write: #/##/###/####
// headers, **bold**, *italic*, `code`, inline $LaTeX$, "---" horizontal rules,
// and numbered/bulleted lists (including nested sub-bullets under a numbered
// item — confirmed a real, common shape in Methods' researcher output, e.g.
// "1. **Label**:\n   - sub-point\n   - sub-point"). This is a different,
// richer subset than InlineMarkdown (utils/MarkdownBlock.tsx), which was
// scoped for single-sentence schema fields, not freeform multi-paragraph
// agent prose. Math is shown in monospace/italic, not true LaTeX layout.
const INLINE_RE = /(\*\*[^*]+\*\*|`[^`]+`|\$[^$]+\$|\*[^*]+\*)/g;

function renderInline(text: string): React.ReactNode[] {
  return text.split(INLINE_RE).map((part, i) => {
    if (/^\*\*[^*]+\*\*$/.test(part)) return <strong key={i}>{part.slice(2, -2)}</strong>;
    if (/^`[^`]+`$/.test(part)) return <code key={i} className={styles.code}>{part.slice(1, -1)}</code>;
    if (/^\$[^$]+\$$/.test(part)) return <span key={i} className={styles.math}>{part.slice(1, -1)}</span>;
    if (/^\*[^*]+\*$/.test(part)) return <em key={i}>{part.slice(1, -1)}</em>;
    return part;
  });
}

// A line is a list item if — after its leading whitespace (which encodes
// nesting depth) — it starts with "N." or a bare "-"/"*" marker. The marker
// is stripped and consumed *before* renderInline ever sees the line, which
// also sidesteps a real ambiguity: "*" is both the italic delimiter and a
// bullet marker, and running the italic regex over multiple "* "-prefixed
// lines at once would wrongly pair markers from different lines as one
// italic span.
const LIST_LINE_RE = /^(\s*)(?:(\d+)\.|[-*])\s+(.+)$/;
const HR_LINE_RE = /^(-{3,}|\*{3,}|_{3,})$/;

// A bulleted/numbered line whose entire text is just "Label:" with nothing
// else on that line — the real content is nested underneath it, not on the
// line itself — is a structural field label from the planner's own output
// format (e.g. "* instructions:" followed by the actual instructions as
// child bullets), not a genuine list item. Confirmed real, recurring labels:
// "Step 1:", "instructions:", "sub-task:" (bare form), "bullet points:".
// These read as scaffolding, not content, once you're several nested
// levels deep — rendered bold with no bullet instead. "bullet points:"
// specifically carries zero information beyond "a list follows" (which the
// list itself already shows), so it's dropped rather than kept.
const BARE_LABEL_RE = /^([A-Za-z][\w -]*):$/;
const DROP_LABEL_RE = /^bullet[\s-]*points?$/i;

// Real agent output mixes list-marker lines with plain label/text lines at
// the same or deeper indentation with no blank line between them — e.g. the
// planner's raw plan text nests "sub-task: ...", "agent: researcher" (no
// marker) inside a "- Step 1:" bullet, and researcher content interleaves
// unmarked section labels ("Independent Variables:") between numbered
// items. Requiring every line in a block to carry a marker (the previous
// design) meant one unmarked line anywhere broke the *entire* block back to
// raw text. Every non-blank line is now classified individually instead —
// marker lines become list rows, everything else becomes a plain row at
// its own indentation depth — so a stray label line degrades gracefully in
// place rather than taking its whole block down with it.
type OutlineRow =
  | { kind: 'hr' }
  | { kind: 'item'; marker: string | null; text: string; depth: number };

// Rows below this nest visually no deeper than the cap (the raw indent stack
// still tracks true depth for correct pop/push logic against later lines) —
// a backstop against runaway or malformed indentation producing unbounded
// visual nesting.
const MAX_LIST_DEPTH = 4;

// Depth is derived from the sequence of indent widths actually seen, not a
// fixed division — real content indents sub-bullets by 3 spaces and
// sub-sub-bullets by 5, not a clean multiple, so a running stack (classic
// nested-list-by-indentation algorithm) is the only reliable way to derive
// depth from irregular indentation.
function parseOutline(lines: string[]): OutlineRow[] {
  const nonBlank = lines.filter(l => l.trim());
  const rows: OutlineRow[] = [];
  const indentStack: number[] = [];

  for (const line of nonBlank) {
    if (HR_LINE_RE.test(line.trim())) {
      rows.push({ kind: 'hr' });
      continue;
    }

    const listMatch = line.match(LIST_LINE_RE);
    let indentStr: string;
    let marker: string | null;
    let text: string;
    if (listMatch) {
      [, indentStr, , text] = listMatch;
      marker = listMatch[2] ? `${listMatch[2]}.` : '•';
    } else {
      const plain = line.match(/^(\s*)(.+)$/)!;
      [, indentStr, text] = plain;
      marker = null;
    }

    const indent = indentStr.length;
    while (indentStack.length > 0 && indent <= indentStack[indentStack.length - 1]) {
      indentStack.pop();
    }
    // Pushed before the bare-label check below (even for a dropped row) so
    // any nested children still measure their depth against this line's
    // indent, not the ancestor above it.
    indentStack.push(indent);
    const depth = Math.min(indentStack.length - 1, MAX_LIST_DEPTH);

    const bareLabel = marker ? text.trim().match(BARE_LABEL_RE) : null;
    if (bareLabel) {
      if (DROP_LABEL_RE.test(bareLabel[1].trim())) continue;
      rows.push({ kind: 'item', marker: null, text: `**${bareLabel[1]}:**`, depth });
      continue;
    }

    rows.push({ kind: 'item', marker, text, depth });
  }
  return rows;
}

interface OutlineNode {
  row: OutlineRow;
  children: OutlineNode[];
}

// Real <ul>/<ol> nesting built from parseOutline's flat, depth-tagged rows —
// the classic "flat indented list -> tree" algorithm (a stack of open
// groups keyed by depth; a row closes any open group at >= its own depth,
// then opens a new one for its own children). Previously every row rendered
// as a same-level <div> with paddingLeft: depth*16 — visual indentation
// only, so screen readers saw one flat list regardless of real nesting.
function buildOutlineTree(rows: OutlineRow[]): OutlineNode[] {
  const root: OutlineNode[] = [];
  const stack: { depth: number; children: OutlineNode[] }[] = [{ depth: -1, children: root }];
  for (const row of rows) {
    const depth = row.kind === 'item' ? row.depth : 0;
    while (stack.length > 1 && stack[stack.length - 1].depth >= depth) stack.pop();
    const node: OutlineNode = { row, children: [] };
    stack[stack.length - 1].children.push(node);
    stack.push({ depth, children: node.children });
  }
  return root;
}

// role="list"/"listitem" is a defensive belt-and-suspenders: some browsers
// (historically Safari) drop the implicit list semantics once `display`
// isn't the default `list-item`/`block`, which the flex layout below needs
// for the row's gap/alignment — see https://www.scottohara.me/blog/2019/01/12/lists-and-safari.html.
function renderOutlineTree(nodes: OutlineNode[], keyPrefix: string): React.ReactNode {
  if (nodes.length === 0) return null;
  const ordered = nodes.some(n => n.row.kind === 'item' && n.row.marker && /^\d+\.$/.test(n.row.marker));
  const ListTag = ordered ? 'ol' : 'ul';

  return (
    <ListTag className={styles.list} role="list">
      {nodes.map((n, i) =>
        n.row.kind === 'hr' ? (
          <li key={i} role="listitem"><hr className={styles.hr} /></li>
        ) : (
          <li key={i} role="listitem">
            <div className={styles.listRow}>
              {n.row.marker && <span className={styles.listMarker}>{n.row.marker}</span>}
              <span className={styles.listText}>{renderInline(n.row.text)}</span>
            </div>
            {n.children.length > 0 && renderOutlineTree(n.children, `${keyPrefix}-${i}`)}
          </li>
        )
      )}
    </ListTag>
  );
}

function renderLines(lines: string[], key: string): React.ReactNode {
  const rows = parseOutline(lines);
  if (rows.length === 0) return null;
  return <div key={key}>{renderOutlineTree(buildOutlineTree(rows), key)}</div>;
}

// cmbagent writes a "#### Heading" line directly followed by its body on the
// very next line, with no blank line between them (confirmed against real
// agent output) — so the heading is only ever the block's first line, not
// the whole block. Heading levels 1-4 all appear in real output; #/## get
// the bolder style, ###/#### the lighter one — two visual tiers, not four.
function renderBlock(block: string, key: number): React.ReactNode {
  const lines = block.split('\n');
  const heading = lines[0].match(/^(#{1,4})\s+(.+)$/);
  if (heading) {
    const body = renderLines(lines.slice(1), `${key}-body`);
    return (
      <div key={key}>
        <p className={heading[1].length <= 2 ? styles.heading2 : styles.heading3}>
          {renderInline(heading[2])}
        </p>
        {body}
      </div>
    );
  }
  return renderLines(lines, String(key));
}

export function renderLiteMarkdown(content: string): React.ReactNode {
  return content.split(/\n{2,}/).map(b => b.trim()).filter(Boolean).map(renderBlock);
}
