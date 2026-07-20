import { Fragment } from 'react';
import { renderLiteMarkdown } from '../../../utils/liteMarkdown';
import { CollapsibleLogCard } from '../CollapsibleLogCard/CollapsibleLogCard';
import type { IdeaTranscriptRound } from '../../../types/pipeline';
import styles from './IdeaTranscript.module.css';

// Shared across three surfaces: the thread's live AdversarialLogCard, the
// static "Adversarial Loop Log" section in IdeaFullPage.tsx, and the Right
// Panel's Discussion tab — one rendering of the idea_maker/idea_hater
// transcript so all three stay visually and behaviourally consistent.

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
                {renderLiteMarkdown(r.content)}
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
  collapseTrigger?: boolean;
  headerRight?: React.ReactNode;
}) {
  return (
    <CollapsibleLogCard
      title="Idea Transcript"
      defaultCollapsed={defaultCollapsed}
      collapseTrigger={collapseTrigger}
      headerRight={headerRight}
    >
      {rounds.length > 0
        ? <IdeaTranscriptRounds rounds={rounds} />
        : <p className={styles.waiting}>Waiting for the first exchange…</p>}
    </CollapsibleLogCard>
  );
}
