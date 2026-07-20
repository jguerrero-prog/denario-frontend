import { renderLiteMarkdown } from '../../../utils/liteMarkdown';
import { CollapsibleLogCard } from '../CollapsibleLogCard/CollapsibleLogCard';
import type { MethodsPlanningTurn, MethodsExecutionStep } from '../../../types/pipeline';
import styles from './MethodsLog.module.css';

// Methods' Rigorous-track reasoning log — see REASONING_LOG_TICKETS.md.
// Two structurally different sources, so two different visual treatments:
// PlanningLoop reuses the same pill-pair pattern as Idea's transcript (it's
// a genuine two-voice debate, planner vs plan_reviewer), but StepList does
// NOT — execution is one agent (researcher) narrating through the plan
// sequentially, no second voice to pair against, so it reuses Methods' own
// existing step-badge convention (MethodsFullPage.module.css's
// .substepNum/.substepLabel) instead of the pill motif.

export function PlanningLoop({ turns }: { turns: MethodsPlanningTurn[] }) {
  if (turns.length === 0) return null;

  return (
    <div className={styles.planningTurns}>
      {turns.map((t, i) => (
        <div key={i} className={styles.entry}>
          <span className={styles.chip}>{t.speaker === 'planner' ? 'PLAN' : 'REVIEW'}</span>
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

  return (
    <div className={styles.sections}>
      {planningLog.length > 0 && (
        <div className={styles.section}>
          <p className={styles.sectionLabel}>Planning · planner ↔ plan_reviewer</p>
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
}: {
  planningLog: MethodsPlanningTurn[];
  executionLog: MethodsExecutionStep[];
  defaultCollapsed: boolean;
  collapseTrigger?: boolean;
  headerRight?: React.ReactNode;
}) {
  const hasContent = planningLog.length > 0 || executionLog.length > 0;

  return (
    <CollapsibleLogCard
      title="Methods Reasoning Log"
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
