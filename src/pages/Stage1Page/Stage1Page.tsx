import { useState, useEffect } from 'react';
import { Sidebar } from '../../components/organisms/Sidebar/Sidebar';
import { ModelDropdown, type ModelGroup } from '../../components/molecules/ModelDropdown/ModelDropdown';
import styles from './Stage1Page.module.css';

export type Stage1Variant = 'idle' | 'running' | 'complete';

const MODEL_OPTIONS: ModelGroup[] = [
  { provider: 'OPENAI',    models: ['gpt-4.1', 'gpt-4o', 'gpt-4o-mini', 'o3', 'o3-mini'] },
  { provider: 'ANTHROPIC', models: ['claude-opus-4', 'claude-sonnet-4', 'claude-haiku-4'] },
  { provider: 'GOOGLE',    models: ['gemini-2.5-pro', 'gemini-2.5-flash'] },
];

const LOOP_STATUSES = [
  'Initialising adversarial loop…',
  'idea_maker proposing hypothesis…',
  'idea_hater reviewing for weaknesses…',
  'Refining — iteration 2 of 4…',
  'Stress-testing temporal scope…',
  'idea_hater challenging methodology…',
  'Hypothesis converging…',
];

const STAGE_OUTPUTS = [
  { id: 'input',      name: 'Input Prompt',    result: null },
  { id: 'idea',       name: 'Idea',            result: null },
  { id: 'methods',    name: 'Methods',         result: null },
  { id: 'analysis',   name: 'Analysis',
    result: { file: 'results.md', time: 'Executed in 1m 42s', stats: ['R² 0.718', 'p < 0.001', '9 plots'] }
  },
  { id: 'paper',      name: 'Paper',           result: null },
  { id: 'literature', name: 'Literature Review', result: null },
  { id: 'referee',    name: 'Referee Report',  result: null },
  { id: 'keywords',   name: 'Keywords',        result: null },
];

// ── Icons ─────────────────────────────────────────────────────────────────────

function PanelRightIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M15 3v18" />
    </svg>
  );
}

function PaperclipIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" />
    </svg>
  );
}

function ArrowUpIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 19V5M5 12l7-7 7 7" />
    </svg>
  );
}

function FolderSmallIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

// ── Cycling status ─────────────────────────────────────────────────────────────

function CyclingStatus() {
  const [idx, setIdx] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    let swap: ReturnType<typeof setTimeout>;
    const hold = setTimeout(() => {
      setVisible(false);
      swap = setTimeout(() => {
        setIdx(i => (i + 1) % LOOP_STATUSES.length);
        setVisible(true);
      }, 380);
    }, 2000);
    return () => { clearTimeout(hold); clearTimeout(swap); };
  }, [idx]);

  return (
    <div className={styles.cyclingStatus}>
      <div className={styles.cyclingDot} />
      <span className={styles.cyclingText} style={{ opacity: visible ? 1 : 0 }}>
        {LOOP_STATUSES[idx]}
      </span>
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export function Stage1Page({ variant = 'idle' }: { variant?: Stage1Variant }) {
  const [summarizerModel, setSummarizerModel] = useState('gpt-4.1');
  const [formatterModel, setFormatterModel] = useState('o3-mini');
  const [activeTab, setActiveTab] = useState<'configuration' | 'outputs'>(
    variant === 'complete' ? 'outputs' : 'configuration'
  );
  const [expandedStages, setExpandedStages] = useState<Set<string>>(new Set(['analysis']));

  function toggleStage(id: string) {
    setExpandedStages(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  const chosenAction = variant === 'complete' ? 'Standard' : 'Rigorous';

  const composePlaceholder = variant === 'complete'
    ? 'Ask Denario to refine the hypothesis…'
    : variant === 'running'
    ? 'Ask Denario anything while it works…'
    : 'Ask Denario anything or add more context…';

  return (
    <div className={styles.layout}>
      <Sidebar activeStageId="input" />

      {/* ── Main area ── */}
      <main className={styles.main}>
        {/* Breadcrumb bar */}
        <div className={styles.breadcrumb}>
          <div className={styles.breadcrumbLeft}>
            <span className={styles.breadcrumbStage}>Stage 1</span>
            <span className={styles.breadcrumbSep}>·</span>
            <span className={styles.breadcrumbLabel}>Input Prompt</span>
          </div>
          <div className={styles.breadcrumbRight}>
            <button className={styles.panelToggleBtn} aria-label="Open right panel">
              <PanelRightIcon />
            </button>
          </div>
        </div>

        {/* Conversation viewport */}
        <div className={styles.conversationViewport}>
          <div className={styles.conversationStack}>

            {/* User message bubble */}
            <div className={styles.userMessage}>
              <p className={styles.userMessageText}>
                I have a CSV file with daily atmospheric CO₂ readings (ppm) and surface temperature anomalies (°C) collected across 23 monitoring stations from 2019–2024. I want to investigate whether rising CO₂ concentrations serve as a statistically significant predictor of temperature anomalies over this 5-year observation window.
              </p>
              <p className={styles.userToolsText}>
                Preferred tools: pandas, statsmodels, matplotlib, scipy
              </p>
              <div className={styles.fileChipInline}>
                <div className={styles.greenDot} />
                <span className={styles.fileChipMono}>co2_data_2019_2024.csv</span>
              </div>
            </div>

            {/* First Denario response */}
            <div className={styles.aiResponse}>
              <div className={styles.aiHeader}>
                <div className={styles.aiHeaderLeft}>
                  <div className={styles.aiAvatar}>D</div>
                  <span className={styles.aiName}>Denario</span>
                </div>
                <span className={styles.aiTimestamp}>just now</span>
              </div>

              <p className={styles.aiText}>
                {variant === 'complete'
                  ? 'Research scope captured. Standard works for exploratory work.'
                  : 'Research scope captured. For a submission-quality study, Rigorous is the stronger choice — it stress-tests the hypothesis before you commit to it. Standard works for exploratory work. Which would you prefer?'
                }
              </p>

              {variant === 'idle' && (
                <div className={styles.aiActions}>
                  <div className={styles.aiActionRow}>
                    <button className={styles.actionPrimary}>Rigorous</button>
                    <button className={styles.actionSecondary}>Standard</button>
                  </div>
                  <p className={styles.actionHint}>Rigorous is recommended for peer-review submissions.</p>
                </div>
              )}
            </div>

            {/* User reply bubble — chosen action */}
            {variant !== 'idle' && (
              <div className={styles.userReply}>
                <span className={styles.userReplyText}>{chosenAction}</span>
              </div>
            )}

            {/* Running — cycling status */}
            {variant === 'running' && (
              <div className={styles.aiResponse}>
                <div className={styles.aiHeader}>
                  <div className={styles.aiHeaderLeft}>
                    <div className={styles.aiAvatar}>D</div>
                    <span className={styles.aiName}>Denario</span>
                  </div>
                  <span className={styles.aiTimestamp}>just now</span>
                </div>
                <CyclingStatus />
              </div>
            )}

            {/* Complete — idea.md result card */}
            {variant === 'complete' && (
              <div className={styles.aiResponse}>
                <div className={styles.aiHeader}>
                  <div className={styles.aiHeaderLeft}>
                    <div className={styles.aiAvatar}>D</div>
                    <span className={styles.aiName}>Denario</span>
                  </div>
                  <span className={styles.aiTimestamp}>just now</span>
                </div>
                <p className={styles.aiText}>
                  Generated in 1 min 12 sec. Review the hypothesis below — edit it here before approving, or approve to unlock the Methods stage.
                </p>
                <div className={styles.ideaCard}>
                  <div className={styles.ideaCardHeader}>
                    <div className={styles.ideaCardFile}>
                      <div className={styles.greenDotSm} />
                      <span className={styles.ideaFileName}>idea.md</span>
                    </div>
                    <span className={styles.ideaCardBadge}>Generated · Standard</span>
                  </div>
                  <h2 className={styles.ideaTitle}>
                    Temporal Correlation Between Atmospheric CO₂ Concentration and Surface Temperature Anomalies (2019–2024)
                  </h2>
                  <p className={styles.ideaBody}>
                    This study tests whether a statistically significant positive correlation exists between rising atmospheric CO₂ concentrations and concurrent surface temperature anomalies using Pearson and Spearman correlation coefficients alongside OLS regression (statsmodels).
                  </p>
                  <div className={styles.ideaTags}>
                    <span className={styles.ideaTag}>Time-series regression</span>
                    <span className={styles.ideaTag}>OLS · Pearson · Spearman</span>
                  </div>
                  <div className={styles.ideaDivider} />
                  <div className={styles.ideaActions}>
                    <button className={styles.actionSecondary}>Edit hypothesis</button>
                    <button className={styles.actionPrimary}>Approve &amp; Proceed →</button>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Compose bar */}
        <div className={styles.composeArea}>
          <div className={styles.composeBar}>
            <span className={styles.composeClip}><PaperclipIcon /></span>
            <span className={styles.composePlaceholder}>{composePlaceholder}</span>
            <button className={styles.sendBtn} aria-label="Send">
              <ArrowUpIcon />
            </button>
          </div>
        </div>
      </main>

      {/* ── Right panel ── */}
      <aside className={styles.rightPanel}>
        {/* Tabs */}
        <div className={styles.panelTabs}>
          <button
            className={`${styles.panelTab} ${activeTab === 'configuration' ? styles.panelTabActive : ''}`}
            onClick={() => setActiveTab('configuration')}
          >
            Configuration
          </button>
          <button
            className={`${styles.panelTab} ${activeTab === 'outputs' ? styles.panelTabActive : ''}`}
            onClick={() => setActiveTab('outputs')}
          >
            Outputs
          </button>
        </div>

        {/* Configuration tab */}
        {activeTab === 'configuration' && (
          <>
            <div className={styles.panelBody}>
              <div className={styles.panelSection}>
                <p className={styles.panelSectionLabel}>Stage 1 Models</p>
                <div className={styles.configField}>
                  <label className={styles.configLabel}>Summarizer Model</label>
                  <ModelDropdown value={summarizerModel} options={MODEL_OPTIONS} onChange={setSummarizerModel} />
                </div>
                <div className={styles.configField}>
                  <label className={styles.configLabel}>Formatter Model</label>
                  <ModelDropdown value={formatterModel} options={MODEL_OPTIONS} onChange={setFormatterModel} />
                </div>
              </div>

              <div className={styles.panelDivider} />

              <div className={styles.panelSection}>
                <p className={styles.panelSectionLabel}>Workspace</p>
                <div className={styles.workspaceRow}>
                  <span className={styles.workspaceIcon}><FolderSmallIcon /></span>
                  <span className={styles.workspacePath}>~/research/co2-temp-study/</span>
                </div>
                <div className={styles.workspaceRow}>
                  <div className={styles.greenDotSm} />
                  <span className={styles.workspaceFile}>co2_data_2019_2024.csv</span>
                </div>
              </div>
            </div>
            <div className={styles.panelFooter}>
              <button className={styles.saveBtn}>Save configuration</button>
            </div>
          </>
        )}

        {/* Outputs tab */}
        {activeTab === 'outputs' && (
          <>
            <div className={styles.outputsList}>
              {STAGE_OUTPUTS.map(stage => {
                const isExpanded = expandedStages.has(stage.id);
                return (
                  <div key={stage.id} className={styles.outputStage}>
                    <button
                      className={`${styles.outputRow} ${isExpanded ? styles.outputRowExpanded : ''}`}
                      onClick={() => toggleStage(stage.id)}
                    >
                      <span className={styles.outputStageName}>{stage.name}</span>
                      <span className={styles.outputChevron}>
                        {isExpanded ? <ChevronDownIcon /> : <ChevronRightIcon />}
                      </span>
                    </button>
                    {isExpanded && stage.result && (
                      <div className={styles.outputExpanded}>
                        <div className={styles.outputFileRow}>
                          <div className={styles.outputFileChip}>
                            <div className={styles.greenDotSm} />
                            <span className={styles.outputFileName}>{stage.result.file}</span>
                          </div>
                          <span className={styles.outputTime}>{stage.result.time}</span>
                        </div>
                        <div className={styles.outputStats}>
                          {stage.result.stats.map(s => (
                            <span key={s} className={styles.outputStat}>{s}</span>
                          ))}
                        </div>
                        <button className={styles.outputOpenLink}>Open full →</button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <div className={styles.panelFooter}>
              <button className={styles.exportBtn}>Export manuscript preview</button>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
