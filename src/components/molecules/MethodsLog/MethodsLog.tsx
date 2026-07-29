import { renderLiteMarkdown } from '../../../utils/liteMarkdown';
import { CollapsibleLogCard } from '../CollapsibleLogCard/CollapsibleLogCard';
import type { MethodsPlanningTurn, MethodsExecutionStep } from '../../../types/pipeline';
import styles from './MethodsLog.module.css';

// Rigorous-track reasoning log — see REASONING_LOG_TICKETS.md. Built for
// Methods first, generalized (ticket 2.1) to any stage producing the same
// two-source shape (Idea-Rigorous next, ticket 2.2) — no component here
// hardcodes Methods' specific agent names. Two structurally different
// sources, so two different visual treatments: PlanningLoop reuses the
// same pill-pair pattern as Idea's Fast-track transcript (it's a genuine
// two-voice debate), but StepList does NOT — execution is one agent
// narrating through the plan sequentially, no second voice to pair
// against, so it reuses Methods' own existing step-badge convention
// (MethodsFullPage.module.css's .substepNum/.substepLabel) instead of the
// pill motif.

// Short chip labels for known planning-debate speakers (ticket 2.1) — falls
// back to the raw agent name (CSS already uppercases for display, see
// MethodsLog.module.css's .chip) for any speaker not listed here, so a new
// stage's debate pair still renders something reasonable without a code
// change here. idea_maker/idea_hater pre-seeded for ticket 2.2's
// Idea-Rigorous reuse, confirmed real cmbagent agent names for that case.
const SPEAKER_CHIP_LABELS: Record<string, string> = {
  planner: 'PLAN',
  plan_reviewer: 'REVIEW',
  idea_maker: 'IDEA',
  idea_hater: 'CRITIC',
};

function speakerChipLabel(speaker: string): string {
  return SPEAKER_CHIP_LABELS[speaker] ?? speaker;
}

export function PlanningLoop({ turns }: { turns: MethodsPlanningTurn[] }) {
  if (turns.length === 0) return null;

  return (
    <div className={styles.planningTurns}>
      {turns.map((t, i) => (
        <div key={i} className={styles.entry}>
          <span className={styles.chip}>{speakerChipLabel(t.speaker)}</span>
          {renderLiteMarkdown(t.content)}
        </div>
      ))}
    </div>
  );
}

export function StepList({ steps }: { steps: MethodsExecutionStep[] }) {
  if (steps.length === 0) return null;

  return (
    <div className={styles.steps}>
      {steps.map((s, i) => (
        <div key={i} className={styles.step}>
          {i > 0 && <div className={styles.stepDivider} />}
          <div className={styles.stepTop}>
            <span className={styles.stepNum}>{s.step}</span>
            <span className={styles.stepLabel}>{s.title}</span>
          </div>
          {renderLiteMarkdown(s.content)}
        </div>
      ))}
    </div>
  );
}

// Bare content — both sections, no card chrome. Used directly by the Right
// Panel's Discussion tab (which, like Idea's, shows things open with no
// nested collapse — the tab itself is the "go read this" destination) and
// composed into MethodsLogCard below for the thread/full-page surfaces.
export function MethodsLogSections({
  planningLog,
  executionLog,
}: {
  planningLog: MethodsPlanningTurn[];
  executionLog: MethodsExecutionStep[];
}) {
  if (planningLog.length === 0 && executionLog.length === 0) return null;

  // Derived from the real turns rather than hardcoded (ticket 2.1) — for
  // Methods this reproduces "planner ↔ plan_reviewer" exactly (planner
  // speaks first in real transcripts), and for Idea-Rigorous's reuse
  // (ticket 2.2) it correctly shows "idea_maker ↔ idea_hater" instead.
  const planningSpeakers = [...new Set(planningLog.map(t => t.speaker))];

  return (
    <div className={styles.sections}>
      {planningLog.length > 0 && (
        <div className={styles.section}>
          <p className={styles.sectionLabel}>Planning · {planningSpeakers.join(' ↔ ')}</p>
          <PlanningLoop turns={planningLog} />
        </div>
      )}
      {executionLog.length > 0 && (
        <div className={styles.section}>
          <p className={styles.sectionLabel}>Execution · {executionLog.length} step{executionLog.length === 1 ? '' : 's'}</p>
          <StepList steps={executionLog} />
        </div>
      )}
    </div>
  );
}

export function MethodsLogCard({
  planningLog,
  executionLog,
  defaultCollapsed,
  collapseTrigger,
  headerRight,
  title = 'Methods Reasoning Log',
}: {
  planningLog: MethodsPlanningTurn[];
  executionLog: MethodsExecutionStep[];
  defaultCollapsed: boolean;
  collapseTrigger?: boolean;
  headerRight?: React.ReactNode;
  // Ticket 2.1 — overridable so ticket 2.2 can reuse this card for
  // Idea-Rigorous's log without it misleadingly saying "Methods".
  title?: string;
}) {
  const hasContent = planningLog.length > 0 || executionLog.length > 0;

  return (
    <CollapsibleLogCard
      title={title}
      defaultCollapsed={defaultCollapsed}
      collapseTrigger={collapseTrigger}
      headerRight={headerRight}
    >
      {hasContent
        ? <MethodsLogSections planningLog={planningLog} executionLog={executionLog} />
        : <p className={styles.waiting}>Waiting for the plan to take shape…</p>}
    </CollapsibleLogCard>
  );
}
