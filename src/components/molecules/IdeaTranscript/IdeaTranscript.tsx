import { Fragment, useEffect, useRef, useState } from 'react';
import type { IdeaTranscriptRound } from '../../../types/pipeline';
import styles from './IdeaTranscript.module.css';

// Shared across three surfaces: the thread's live AdversarialLogCard, the
// static "Adversarial Loop Log" section in IdeaFullPage.tsx, and the Right
// Panel's Discussion tab — one rendering of the idea_maker/idea_hater
// transcript so all three stay visually and behaviourally consistent.

function ChevronRightIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}

// cmbagent's idea_maker/idea_hater write real freeform markdown — ## headers,
// **bold**, *italic*, `code`, inline $LaTeX$ — not the single-sentence
// fields InlineMarkdown (utils/MarkdownBlock.tsx) was scoped for. No
// markdown/LaTeX library exists in this project, so this renders the same
// bounded subset by hand: headers and inline emphasis/code/math. List
// markers (numbered or bulleted) are left as literal text rather than given
// real <ol>/<li> semantics — the real critiques nest sub-bullets inside
// numbered items irregularly enough that a correct nested-list parser isn't
// worth it here; math is shown in monospace/italic, not true LaTeX layout.
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

// cmbagent writes a "## Heading" line directly followed by its body on the
// very next line, with no blank line between them (confirmed against the
// real idea.log) — so the heading is only ever the block's first line, not
// the whole block.
function renderBlock(block: string, key: number): React.ReactNode {
  const lines = block.split('\n');
  const heading = lines[0].match(/^(#{2,3})\s+(.+)$/);
  if (heading) {
    const body = lines.slice(1).join('\n').trim();
    return (
      <div key={key}>
        <p className={heading[1].length === 2 ? styles.heading2 : styles.heading3}>
          {renderInline(heading[2])}
        </p>
        {body && <p className={styles.entryText}>{renderInline(body)}</p>}
      </div>
    );
  }
  return <p key={key} className={styles.entryText}>{renderInline(block)}</p>;
}

function renderContent(content: string): React.ReactNode {
  return content.split(/\n{2,}/).map(b => b.trim()).filter(Boolean).map(renderBlock);
}

// Grouped by round (not a flat list) so the CSS can give tight spacing within
// a turn, medium spacing between the two turns of one round, and generous
// spacing (plus a divider) between separate rounds — proximity doing the
// work of showing structure, not just color.
function groupByRound(rounds: IdeaTranscriptRound[]): IdeaTranscriptRound[][] {
  const groups: IdeaTranscriptRound[][] = [];
  for (const r of rounds) {
    const current = groups[groups.length - 1];
    if (current && current[0].round === r.round) current.push(r);
    else groups.push([r]);
  }
  return groups;
}

export function IdeaTranscriptRounds({ rounds }: { rounds: IdeaTranscriptRound[] }) {
  if (rounds.length === 0) return null;

  return (
    <div className={styles.rounds}>
      {groupByRound(rounds).map((turns, gi) => (
        <Fragment key={gi}>
          {gi > 0 && <div className={styles.roundDivider} />}
          <div className={styles.round}>
            {turns.map((r, ti) => (
              <div key={ti} className={styles.entry}>
                <span className={styles.chip}>
                  {r.speaker === 'idea_maker' ? 'IDEA' : 'CRITIQUE'}
                </span>
                {renderContent(r.content)}
              </div>
            ))}
          </div>
        </Fragment>
      ))}
    </div>
  );
}

export function IdeaTranscriptCard({
  rounds,
  defaultCollapsed,
  collapseTrigger,
  headerRight,
}: {
  rounds: IdeaTranscriptRound[];
  defaultCollapsed: boolean;
  collapseTrigger?: boolean;   // rising edge (false → true) force-collapses once, e.g. on stage completion
  headerRight?: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const prevTriggerRef = useRef(collapseTrigger ?? false);

  useEffect(() => {
    if (collapseTrigger && !prevTriggerRef.current) setCollapsed(true);
    prevTriggerRef.current = collapseTrigger ?? false;
  }, [collapseTrigger]);

  return (
    <div className={styles.card}>
      <button
        type="button"
        className={styles.header}
        onClick={() => setCollapsed(c => !c)}
        aria-expanded={!collapsed}
      >
        <span className={`${styles.chevron} ${collapsed ? '' : styles.chevronOpen}`}>
          <ChevronRightIcon />
        </span>
        <span className={styles.title}>Idea Transcript</span>
        <span className={styles.headerRight}>{headerRight}</span>
      </button>
      {!collapsed && (
        rounds.length > 0
          ? <IdeaTranscriptRounds rounds={rounds} />
          : <p className={styles.waiting}>Waiting for the first exchange…</p>
      )}
    </div>
  );
}
