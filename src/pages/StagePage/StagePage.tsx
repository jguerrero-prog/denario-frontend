import { useParams, Navigate } from 'react-router-dom';
import { Sidebar } from '../../components/organisms/Sidebar/Sidebar';
import { ConversationThread } from './ConversationThread';
import { RightPanel } from './RightPanel';
import { usePipelineStore } from '../../store/pipelineStore';
import { STAGE_CONFIG } from '../../config/stageConfig';
import type { StageId } from '../../types/pipeline';
import styles from './StagePage.module.css';

const VALID_STAGE_IDS = new Set<string>([
  'input', 'idea', 'methods', 'analysis', 'paper', 'literature', 'referee', 'keywords',
]);

function PanelRightIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M15 3v18" />
    </svg>
  );
}

export function StagePage() {
  const { stageId } = useParams<{ stageId: string }>();
  const pipeline = usePipelineStore(s => s.pipeline);

  if (!stageId || !VALID_STAGE_IDS.has(stageId)) {
    return <Navigate to="/" replace />;
  }

  if (!pipeline) {
    return <Navigate to="/" replace />;
  }

  const sid = stageId as StageId;
  const config = STAGE_CONFIG[sid];
  const stage = pipeline.stages[sid];

  return (
    <div className={styles.layout}>
      <Sidebar userEmail="researcher@lab.edu" />

      <main className={styles.main}>
        {/* Breadcrumb */}
        <div className={styles.breadcrumb}>
          <div className={styles.breadcrumbLeft}>
            <span className={styles.breadcrumbStage}>
              Stage {Object.keys(STAGE_CONFIG).indexOf(sid) + 1}
            </span>
            <span className={styles.breadcrumbSep}>·</span>
            <span className={styles.breadcrumbLabel}>{config.label}</span>
          </div>
          <div className={styles.breadcrumbRight}>
            <span className={styles.stagePill} data-status={stage.status}>
              {stage.status.charAt(0).toUpperCase() + stage.status.slice(1)}
            </span>
            <button className={styles.panelToggleBtn} aria-label="Toggle right panel">
              <PanelRightIcon />
            </button>
          </div>
        </div>

        <ConversationThread stageId={sid} />
      </main>

      <RightPanel stageId={sid} />
    </div>
  );
}
