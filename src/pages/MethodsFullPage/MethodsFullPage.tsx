import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Sidebar } from '../../components/organisms/Sidebar/Sidebar';
import { usePipelineStore } from '../../store/pipelineStore';
import { STAGE_CONFIG, STAGE_ORDER } from '../../config/stageConfig';
import { MarkdownBlock } from '../../utils/MarkdownBlock';
import type { MethodsResultData, StageId } from '../../types/pipeline';
import styles from './MethodsFullPage.module.css';

// ── Icons ─────────────────────────────────────────────────────────────────────

function ChevronLeftIcon() {
  return (
    <svg className={styles.backChevron} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7.5 2.5L4 6l3.5 3.5" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}

function ChevronUpIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 15l-6-6-6 6" />
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

function PencilIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.5 2.5l2 2L4 12H2v-2L9.5 2.5Z" />
      <path d="M8 4l2 2" />
    </svg>
  );
}

// ── Stage order for outputs list ───────────────────────────────────────────────

const PANEL_STAGES: StageId[] = ['input', 'idea', 'methods', 'analysis', 'paper', 'literature'];

// ── Component ─────────────────────────────────────────────────────────────────

export function MethodsFullPage() {
  const navigate = useNavigate();
  const { projectId, stageId = 'methods' } = useParams<{ projectId: string; stageId: string }>();
  const pipeline = usePipelineStore(s => s.pipeline);
  const result = pipeline?.stages['methods']?.result;
  const data = result?.stageData as MethodsResultData | undefined;

  const stageIndex = STAGE_ORDER.indexOf('methods');
  const stageNum = stageIndex >= 0 ? stageIndex + 1 : 3;
  const file = result?.file ?? 'method.md';

  const [isEditing, setIsEditing] = useState(false);
  const [editingStepIdx, setEditingStepIdx] = useState<number | null>(null);
  const [titleDraft, setTitleDraft] = useState(result?.title ?? '');
  const [stepDrafts, setStepDrafts] = useState<Array<{ label: string; description: string }>>(
    () => (data?.steps ?? []).map(s => ({ label: s.label, description: s.description }))
  );

  function handleBack() {
    navigate(`/project/${projectId}/stage/${stageId}`);
  }

  function handleSave() {
    setIsEditing(false);
    setEditingStepIdx(null);
  }

  const steps = data?.steps ?? [];

  return (
    <div className={styles.layout}>
      <Sidebar userEmail="researcher@lab.edu" />

      {/* Main document area */}
      <main className={styles.main}>
        {/* Top bar */}
        <div className={styles.topBar}>
          <button className={styles.backLink} onClick={handleBack}>
            <ChevronLeftIcon />
            Back to conversation
          </button>

          <div className={styles.breadcrumb}>
            <span className={styles.breadcrumbDim}>Stage {stageNum}</span>
            <span className={styles.breadcrumbSep}>·</span>
            <span className={styles.breadcrumbDim}>Methods</span>
            <span className={styles.breadcrumbSep}>·</span>
            <span className={styles.breadcrumbActive}>{file}</span>
          </div>

          <div className={styles.topBarRight}>
            {isEditing && (
              <>
                <div className={styles.modifiedBadge}>
                  <span className={styles.modifiedDot}>●</span>
                  Modified
                </div>
                <button className={styles.saveBtn} onClick={handleSave}>Save</button>
              </>
            )}
            <button className={styles.iconBtn} aria-label="Copy"><CopyIcon /></button>
            <button className={styles.iconBtn} aria-label="Download"><DownloadIcon /></button>
          </div>
        </div>

        {/* Scrollable document */}
        <div className={styles.scrollArea}>
          <div className={styles.document}>

            {/* Eyebrow */}
            <div className={styles.eyebrow}>
              <span className={styles.eyebrowDot} />
              <div className={styles.fileChip}>
                <span className={styles.fileChipText}>{file}</span>
              </div>
              <span className={styles.eyebrowMeta}>Generated by Denario</span>
              <span className={styles.eyebrowDetail}>· Planner · Plan Reviewer · Method Generator</span>
            </div>

            {/* Title */}
            <h1 className={styles.docTitle}>{result?.title ?? 'Technical Methodology'}</h1>
            <div className={styles.divider} />

            {/* Overview */}
            {data?.overview && (
              <div className={styles.section}>
                <p className={styles.sectionLabel}>Overview</p>
                <MarkdownBlock text={data.overview} className={styles.prose} />
              </div>
            )}

            {/* Execution Steps */}
            <div className={styles.section}>
              <p className={styles.sectionLabel}>Execution Steps</p>
              <div className={styles.stepCards}>
                {steps.map((step, i) => {
                  const isActive = isEditing && editingStepIdx === i;
                  return (
                    <div
                      key={step.n}
                      className={`${styles.stepCard} ${isActive ? styles.stepCardActive : ''}`}
                    >
                      {/* Step header */}
                      <div className={styles.stepCardHeader}>
                        <div className={styles.stepCardLeft}>
                          <div className={styles.stepBadge}>{step.n}</div>
                          {isActive ? (
                            <input
                              className={styles.stepTitleInput}
                              value={stepDrafts[i]?.label ?? step.label}
                              onChange={e => {
                                const next = [...stepDrafts];
                                next[i] = { ...next[i], label: e.target.value };
                                setStepDrafts(next);
                              }}
                            />
                          ) : (
                            <span className={styles.stepCardTitle}>{step.label}</span>
                          )}
                        </div>
                        {isEditing && !isActive && (
                          <div className={styles.stepCardActions}>
                            <div className={styles.toolChip}><span className={styles.toolChipText}>{step.tool}</span></div>
                            <button
                              className={styles.stepPencilBtn}
                              onClick={() => setEditingStepIdx(i)}
                              aria-label="Edit step"
                            >
                              <PencilIcon />
                            </button>
                          </div>
                        )}
                        {!isEditing && (
                          <div className={styles.toolChip}><span className={styles.toolChipText}>{step.tool}</span></div>
                        )}
                      </div>

                      {/* Description */}
                      {isActive ? (
                        <>
                          <textarea
                            className={styles.stepDescTextarea}
                            value={stepDrafts[i]?.description ?? step.description}
                            onChange={e => {
                              const next = [...stepDrafts];
                              next[i] = { ...next[i], description: e.target.value };
                              setStepDrafts(next);
                            }}
                            rows={4}
                          />
                          <div className={styles.toolChipRow}>
                            <div className={styles.toolChip}><span className={styles.toolChipText}>{step.tool}</span></div>
                          </div>
                        </>
                      ) : (
                        <MarkdownBlock text={step.description} className={styles.stepCardBody} />
                      )}

                      {/* Code snippet */}
                      {!isActive && step.codeSnippet && (
                        <div className={styles.codeBlock}>
                          <div className={styles.codeAccent} />
                          <code className={styles.codeText}>{step.codeSnippet}</code>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* End footer */}
            <div className={styles.endFooter}>
              <div className={styles.divider} />
              <p className={styles.endLabel}>End of {file}</p>
            </div>

          </div>
        </div>
      </main>

      {/* Right panel */}
      <aside className={styles.rightPanel}>
        <div className={styles.panelTabs}>
          <span className={`${styles.panelTab} ${styles.panelTabActive}`}>Outputs</span>
          <span className={styles.panelTab}>Config</span>
          <span className={styles.panelCompleteCount}>3 complete</span>
        </div>

        <div className={styles.outputsList}>
          {PANEL_STAGES.map(sid => {
            const isMethodsRow = sid === 'methods';
            const sc = STAGE_CONFIG[sid];
            const s = pipeline?.stages[sid];
            const hasResult = !!s?.result;

            return (
              <div key={sid} className={`${styles.outputRow} ${isMethodsRow ? styles.outputRowExpanded : ''}`}>
                <div className={styles.outputRowHeader}>
                  <span className={styles.outputStageName}>{sc.label}</span>
                  {hasResult && (
                    <span className={styles.outputChevron}>
                      {isMethodsRow ? <ChevronUpIcon /> : <ChevronRightIcon />}
                    </span>
                  )}
                </div>

                {isMethodsRow && (
                  <div className={styles.outputExpandedBody}>
                    <div className={styles.outputFileRow}>
                      <span className={styles.outputFileName}>{file}</span>
                      {isEditing ? (
                        <span className={styles.outputStatusAmber}>Modified — unsaved</span>
                      ) : (
                        <span className={styles.outputStatusGreen}>Currently viewing</span>
                      )}
                    </div>
                    {isEditing ? (
                      <button className={styles.saveCurrentBtn} onClick={handleSave}>
                        Save current →
                      </button>
                    ) : (
                      <div className={styles.outputToolChips}>
                        {['pandas', 'statsmodels', '5 steps'].map(tag => (
                          <div key={tag} className={styles.outputToolChip}>
                            <span className={styles.outputToolChipText}>{tag}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className={styles.panelFooter}>
          <button className={styles.exportBtn}>Export archive</button>
        </div>

        {/* Edit toggle (for demo — in real UI would come from the card) */}
        {!isEditing && (
          <button className={styles.editToggleBtn} onClick={() => setIsEditing(true)}>
            Edit in full view
          </button>
        )}
      </aside>
    </div>
  );
}
