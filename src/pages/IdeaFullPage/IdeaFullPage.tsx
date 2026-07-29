import { useNavigate, useParams, Navigate } from 'react-router-dom';
import { useHydratedPipeline } from '../../hooks/useHydratedPipeline';
import { IdeaTranscriptCard } from '../../components/molecules/IdeaTranscript/IdeaTranscript';
import { MethodsLogCard } from '../../components/molecules/MethodsLog/MethodsLog';
import type { IdeaResultData } from '../../types/pipeline';
import styles from './IdeaFullPage.module.css';

function ChevronLeftIcon() {
  return (
    <svg className={styles.backChevron} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7.5 2.5L4 6l3.5 3.5" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4.5" y="4.5" width="7" height="7" rx="1" />
      <path d="M2.5 9.5V2.5h7" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 2v7M4.5 6.5L7 9l2.5-2.5" />
      <path d="M2 11h10" />
    </svg>
  );
}

export function IdeaFullPage() {
  const navigate = useNavigate();
  const { projectId, stageId = 'idea' } = useParams<{ projectId: string; stageId: string }>();
  const { pipeline, needsFetch, fetchFailed } = useHydratedPipeline(projectId);
  const result = pipeline?.stages[stageId as 'idea']?.result;

  const file = result?.file ?? 'idea.md';

  const data = result?.stageData as IdeaResultData | undefined;

  function handleBack() {
    navigate(`/project/${projectId}/stage/${stageId}`);
  }

  if (fetchFailed) {
    return <Navigate to="/" replace />;
  }

  if (needsFetch) {
    return <div className={styles.page} />;
  }

  return (
    <div className={styles.page}>
      {/* Top bar */}
      <div className={styles.topBar}>
        <button className={styles.backLink} onClick={handleBack}>
          <ChevronLeftIcon />
          Back to conversation
        </button>
      </div>

      {/* Scrollable document */}
      <div className={styles.scrollArea}>
        <div className={styles.document}>

          {/* Header: eyebrow + title + divider */}
          <div className={styles.docHeader}>
            <div className={styles.eyebrow}>
              <div className={styles.eyebrowActions}>
                <button className={styles.iconBtn} aria-label="Copy">
                  <CopyIcon />
                </button>
                <button className={styles.iconBtn} aria-label="Download">
                  <DownloadIcon />
                </button>
              </div>
            </div>
            <h1 className={styles.docTitle}>{result?.title ?? 'Idea'}</h1>
            <div className={styles.divider} />
          </div>

          {/* Hypothesis */}
          <div className={styles.section}>
            <p className={styles.sectionLabel}>Hypothesis</p>
            <p className={styles.prose}>{data?.hypothesis ?? result?.content}</p>
          </div>

          {/* Scope Note */}
          {data?.scopeNote && (
            <div className={styles.section}>
              <p className={styles.sectionLabel}>Scope Note</p>
              <div className={styles.scopeBox}>
                <p className={styles.scopeBoxTitleText}>{data.scopeNote.title}</p>
                <p className={styles.scopeBoxBody}>{data.scopeNote.body}</p>
              </div>
            </div>
          )}

          {/* Research Framing */}
          {data?.researchFraming && (
            <div className={styles.section}>
              <p className={styles.sectionLabel}>Research Framing</p>
              <p className={styles.prose}>{data.researchFraming}</p>
            </div>
          )}

          {/* Methodology Direction */}
          {data?.methodologyTags && data.methodologyTags.length > 0 && (
            <div className={styles.section}>
              <p className={styles.sectionLabel}>Methodology Direction</p>
              <div className={styles.tagRow}>
                {data.methodologyTags.map((tag) => (
                  <div key={tag} className={styles.methodTag}>
                    <span className={styles.methodTagText}>{tag}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Adversarial Loop Log */}
          {data?.transcript && data.transcript.length > 0 && (
            <div className={styles.section}>
              <p className={styles.sectionLabel}>Adversarial Loop Log</p>
              <IdeaTranscriptCard
                rounds={data.transcript}
                defaultCollapsed={true}
                headerRight={
                  <span>{data.transcript[data.transcript.length - 1].round} rounds</span>
                }
              />
            </div>
          )}

          {/* Rigorous-track Reasoning Log (ticket 2.2) — mutually exclusive
              with the Fast-track transcript above; reuses MethodsLogCard
              as-is (generalized in ticket 2.1) with an overridden title so
              it doesn't misleadingly say "Methods". */}
          {((data?.planningLog?.length ?? 0) > 0 || (data?.executionLog?.length ?? 0) > 0) && (
            <div className={styles.section}>
              <p className={styles.sectionLabel}>Reasoning Log</p>
              <MethodsLogCard
                title="Idea Reasoning Log"
                planningLog={data?.planningLog ?? []}
                executionLog={data?.executionLog ?? []}
                defaultCollapsed={true}
                headerRight={
                  <span>{data?.executionLog?.length ?? 0} step{(data?.executionLog?.length ?? 0) === 1 ? '' : 's'}</span>
                }
              />
            </div>
          )}

          {/* Back to conversation */}
          <div className={styles.section}>
            <button className={styles.backToConvoBtn} onClick={handleBack}>
              ← Back to conversation
            </button>
          </div>

          {/* End footer */}
          <div className={styles.endFooter}>
            <div className={styles.divider} />
            <p className={styles.endLabel}>End of {file}</p>
          </div>

        </div>
      </div>
    </div>
  );
}
