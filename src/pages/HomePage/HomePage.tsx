import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from '../../components/organisms/Sidebar/Sidebar';
import { usePipelineStore } from '../../store/pipelineStore';
import { api } from '../../api/client';
import type { BackendProject } from '../../api/client';
import styles from './HomePage.module.css';

// ── Icons ────────────────────────────────────────────────────────────────────

function FileTextSmallIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#2D6A2D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
    </svg>
  );
}

function XSmallIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="#6A6661" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
      <path d="M1.5 1.5L8.5 8.5M8.5 1.5L1.5 8.5" />
    </svg>
  );
}

function PaperclipIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" />
    </svg>
  );
}

function FolderIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function PanelRightIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M15 3v18" />
    </svg>
  );
}

// ── Tool suggestion data ──────────────────────────────────────────────────────

const TOOL_CATEGORIES = [
  { id: 'data',   label: 'Data',   tools: ['pandas', 'numpy', 'scipy', 'xarray', 'polars', 'Dask'] },
  { id: 'ml',     label: 'ML',     tools: ['scikit-learn', 'PyTorch', 'TensorFlow', 'XGBoost', 'statsmodels', 'JAX'] },
  { id: 'viz',    label: 'Viz',    tools: ['matplotlib', 'seaborn', 'plotly', 'ggplot2', 'Bokeh', 'altair'] },
  { id: 'bio',    label: 'Bio',    tools: ['Biopython', 'DESeq2', 'Seurat', 'samtools', 'GATK', 'BLAST'] },
  { id: 'domain', label: 'Domain', tools: ['astropy', 'RDKit', 'netCDF4', 'cartopy', 'PLINK', 'lifelines'] },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const STAGE_LABELS: Record<string, string> = {
  input:      '1 · Input',
  idea:       '2 · Idea',
  methods:    '3 · Methods',
  analysis:   '4 · Analysis',
  paper:      '5 · Paper',
  literature: '6 · Lit Review',
  referee:    '7 · Referee',
  keywords:   '8 · Keywords',
};

const STAGE_ORDER_LIST = ['input','idea','methods','analysis','paper','literature','referee','keywords'];

function deriveStageLabel(project: BackendProject): string {
  // Find the furthest non-locked stage
  const active = [...STAGE_ORDER_LIST].reverse().find(
    s => project.stages[s]?.status !== 'locked'
  );
  return STAGE_LABELS[active ?? 'input'] ?? 'Stage 1 Input';
}

function relativeTime(ts: number): string {
  const diff = Date.now() / 1000 - ts;
  if (diff < 3600)  return 'Last opened just now';
  if (diff < 86400) return `Last opened ${Math.floor(diff / 3600)}h ago`;
  const days = Math.floor(diff / 86400);
  if (days === 1)   return 'Last opened yesterday';
  if (days < 7)     return `Last opened ${days} days ago`;
  if (days < 14)    return 'Last opened 1 week ago';
  return `Last opened ${Math.floor(days / 7)} weeks ago`;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function HomePage() {
  const navigate = useNavigate();
  const createPipeline      = usePipelineStore(s => s.createPipeline);
  const hydratePipeline     = usePipelineStore(s => s.hydratePipeline);
  const setBackendProjectId = usePipelineStore(s => s.setBackendProjectId);

  const [text, setText]             = useState('');
  const [file, setFile]             = useState<{ name: string; size: string } | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [activeTab, setActiveTab]   = useState<string>('data');
  const [recentProjects, setRecentProjects] = useState<BackendProject[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api.listProjects()
      .then(projects =>
        setRecentProjects(
          [...projects].sort((a, b) => b.updated_at - a.updated_at).slice(0, 5)
        )
      )
      .catch(() => {}); // server not running — list stays empty
  }, []);

  const isAttached = file !== null;
  const hasText = text.trim().length > 0;
  const words = wordCount(text);

  function addTool(tool: string) {
    setText(prev => {
      if (prev.toLowerCase().includes(tool.toLowerCase())) return prev;
      const trimmed = prev.trimEnd();
      if (!trimmed) return tool;
      if (trimmed.endsWith(',')) return `${trimmed} ${tool}`;
      return `${trimmed}, ${tool}`;
    });
  }

  function isToolAdded(tool: string): boolean {
    return text.toLowerCase().includes(tool.toLowerCase());
  }

  const activeCategory = TOOL_CATEGORIES.find(c => c.id === activeTab) ?? TOOL_CATEGORIES[0];

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = e.target.files?.[0];
    if (!picked) return;
    setFile({ name: picked.name, size: formatBytes(picked.size) });
    // reset so the same file can be re-attached after dismiss
    e.target.value = '';
  }

  function handleContinue(project: BackendProject) {
    const frontendId = hydratePipeline(project);
    // Find the stage to land on: first idle/error, or last complete
    const activeStage = STAGE_ORDER_LIST.find(
      s => project.stages[s]?.status === 'error' || project.stages[s]?.status === 'idle'
    ) ?? [...STAGE_ORDER_LIST].reverse().find(
      s => project.stages[s]?.status === 'complete'
    ) ?? 'input';
    navigate(`/project/${frontendId}/stage/${activeStage}`);
  }

  async function handleBegin() {
    if (!hasText || isCreating) return;
    setIsCreating(true);

    const frontendId = createPipeline(text, file ?? undefined);

    // Create the backend project so stageRunner has an ID ready on first Generate.
    // If the server is down this is a no-op — stageRunner will retry lazily.
    try {
      const project = await api.createProject(
        text.trim().split(/\s+/).slice(0, 4).join('-').toLowerCase().replace(/[^a-z0-9-]/g, '') || 'new-project',
        text,
      );
      setBackendProjectId(project.id);
    } catch {
      // backend unavailable — proceed anyway
    }

    navigate(`/project/${frontendId}/stage/input`);
  }

  return (
    <div className={styles.layout}>
      <Sidebar />

      <main className={styles.main}>
        {/* Top bar */}
        <div className={styles.topBar}>
          <div />
          <button className={styles.panelToggleBtn} aria-label="Open right panel">
            <PanelRightIcon />
          </button>
        </div>

        {/* Centered content */}
        <div className={styles.contentViewport}>
          <div className={styles.contentStack}>

            {/* Heading */}
            <div className={`${styles.promptHeader} ${isAttached ? styles.promptHeaderAttached : ''}`}>
              <h1 className={styles.promptHeading}>What does your data suggest?</h1>
              <p className={styles.promptSub}>
                Start a new pipeline, jump into a specific tool, or continue a recent project.
              </p>
            </div>

            {/* File chip — shown when file attached */}
            {isAttached && (
              <div className={styles.fileChipRow}>
                <div className={styles.fileChip}>
                  <FileTextSmallIcon />
                  <span className={styles.fileChipName}>{file.name}</span>
                  <div className={styles.fileChipDivider} />
                  <span className={styles.fileChipSize}>{file.size}</span>
                  <button
                    className={styles.fileChipDismiss}
                    aria-label="Remove file"
                    onClick={() => setFile(null)}
                  >
                    <XSmallIcon />
                  </button>
                </div>
              </div>
            )}

            {/* Input card */}
            <div className={`${styles.inputCard} ${isAttached ? styles.inputCardAttached : ''}`}>
              <textarea
                className={styles.inputArea}
                placeholder="Describe your dataset, research domain, and preferred tools..."
                rows={isAttached ? 4 : 3}
                value={text}
                onChange={e => setText(e.target.value)}
              />

              {/* Tool suggestions */}
              <div className={styles.toolsSection}>
                <div className={styles.toolsDivider} />
                <div className={styles.toolsTabRow}>
                  {TOOL_CATEGORIES.map(cat => (
                    <button
                      key={cat.id}
                      type="button"
                      className={`${styles.toolsTab} ${activeTab === cat.id ? styles.toolsTabActive : ''}`}
                      onClick={() => setActiveTab(cat.id)}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
                <div className={styles.toolsChipRow}>
                  {activeCategory.tools.map(tool => {
                    const added = isToolAdded(tool);
                    return (
                      <button
                        key={tool}
                        type="button"
                        className={`${styles.toolChip} ${added ? styles.toolChipAdded : ''}`}
                        onClick={() => addTool(tool)}
                      >
                        {added && <span aria-hidden="true" className={styles.toolChipCheck}>✓</span>}
                        {tool}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className={styles.inputCardFooter}>
                {isAttached ? (
                  <div className={styles.attachedInfo}>
                    <span className={styles.attachedInfoIcon}><PaperclipIcon /></span>
                    <span className={styles.attachedInfoText}>{file.name} attached</span>
                  </div>
                ) : (
                  <div className={styles.attachBtnWrapper}>
                    <button
                      className={styles.attachBtn}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <PaperclipIcon />
                      <span>Attach file</span>
                    </button>
                    <div className={styles.attachTooltip}>Up to 200MB</div>
                  </div>
                )}

                <button
                  className={`${styles.beginBtn} ${isAttached ? styles.beginBtnAttached : ''}`}
                  onClick={handleBegin}
                  disabled={!hasText || isCreating}
                  style={{ opacity: hasText && !isCreating ? 1 : 0.45, cursor: hasText && !isCreating ? 'pointer' : 'default' }}
                >
                  {isCreating ? 'Starting…' : 'Begin →'}
                </button>
              </div>
            </div>

            {/* Word count — shown when text present */}
            {hasText && (
              <div className={styles.wordCount}>{words} {words === 1 ? 'word' : 'words'}</div>
            )}

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />

            {/* Recent projects */}
            {recentProjects.length > 0 && (
              <div className={`${styles.recentSection} ${isAttached ? styles.recentSectionAttached : ''}`}>
                <p className={styles.recentLabel}>Recent Projects</p>
                <div className={styles.projectList}>
                  {recentProjects.map((project, i) => (
                    <div
                      key={project.id}
                      className={`${styles.projectRow} ${i < recentProjects.length - 1 ? styles.projectRowBorder : ''}`}
                    >
                      <div className={styles.projectLeft}>
                        <span className={styles.projectFolderIcon}><FolderIcon /></span>
                        <span className={styles.projectName}>{project.name}</span>
                        <span className={styles.stageBadge}>{deriveStageLabel(project)}</span>
                      </div>
                      <div className={styles.projectRight}>
                        <span className={styles.lastOpened}>{relativeTime(project.updated_at)}</span>
                        <button
                          className={styles.continueLink}
                          onClick={() => handleContinue(project)}
                        >
                          Open
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      </main>
    </div>
  );
}
