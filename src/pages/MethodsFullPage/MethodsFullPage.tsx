import { useNavigate, useParams, Navigate } from 'react-router-dom';
import { useHydratedPipeline } from '../../hooks/useHydratedPipeline';
import { InlineMarkdown } from '../../utils/MarkdownBlock';
import { MethodsLogCard } from '../../components/molecules/MethodsLog/MethodsLog';
import type { MethodsResultData } from '../../types/pipeline';
import styles from './MethodsFullPage.module.css';

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

export function MethodsFullPage() {
  const navigate = useNavigate();
  const { projectId, stageId = 'methods' } = useParams<{ projectId: string; stageId: string }>();
  const { pipeline, needsFetch, fetchFailed } = useHydratedPipeline(projectId);
  const result = pipeline?.stages[stageId as 'methods']?.result;

  const file = result?.file ?? 'methods.md';
  const data = result?.stageData as MethodsResultData | undefined;
  const sections = data?.sections ?? [];
  const planningLog = data?.planningLog ?? [];
  const executionLog = data?.executionLog ?? [];
  const hasLog = planningLog.length > 0 || executionLog.length > 0;

  function handleBack() {
    navigate(`/project/${projectId}/stage/${stageId}`);
  }

  function handleCopy() {
    navigator.clipboard.writeText(result?.content ?? '').catch(() => {});
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
                <button className={styles.iconBtn} aria-label="Copy" onClick={handleCopy}>
                  <CopyIcon />
                </button>
                <button className={styles.iconBtn} aria-label="Download">
                  <DownloadIcon />
                </button>
              </div>
            </div>
            <h1 className={styles.docTitle}>{result?.title ?? 'Technical Methodology'}</h1>
            <div className={styles.divider} />
          </div>

          {/* Overview */}
          {data?.overview && (
            <div className={styles.section}>
              <p className={styles.sectionLabel}>Overview</p>
              <p className={styles.prose}><InlineMarkdown text={data.overview} /></p>
            </div>
          )}

          {/* Sections */}
          {sections.map(section => (
            <div key={section.number} className={styles.section}>
              <p className={styles.sectionLabel}>{section.number}. {section.title}</p>
              <div className={styles.substepStack}>
                {section.substeps.map(sub => (
                  <div key={sub.number} className={styles.substep}>
                    <div className={styles.substepTop}>
                      <span className={styles.substepNum}>{sub.number}</span>
                      <span className={styles.substepLabel}>{sub.label}</span>
                    </div>
                    {sub.body && <p className={styles.substepBody}><InlineMarkdown text={sub.body} /></p>}
                    {sub.points.length > 0 && (
                      <ul className={styles.substepPoints}>
                        {sub.points.map((pt, pi) => (
                          <li key={pi} className={styles.substepPoint}><InlineMarkdown text={pt.text} /></li>
                        ))}
                      </ul>
                    )}
                    {sub.code && (
                      <pre className={styles.codeBlock}><code>{sub.code}</code></pre>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Reasoning Log (Rigorous track only) */}
          {hasLog && (
            <div className={styles.section}>
              <p className={styles.sectionLabel}>Reasoning Log</p>
              <MethodsLogCard
                planningLog={planningLog}
                executionLog={executionLog}
                defaultCollapsed={true}
                headerRight={<span>{executionLog.length} step{executionLog.length === 1 ? '' : 's'}</span>}
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
