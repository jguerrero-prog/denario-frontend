import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from '../../components/organisms/Sidebar/Sidebar';
import { usePipelineStore } from '../../store/pipelineStore';
import { api } from '../../api/client';
import type { BackendProject } from '../../api/client';
import type { Track, StageId } from '../../types/pipeline';
import { STAGE_CONFIG, STAGE_ORDER } from '../../config/stageConfig';
import styles from './HomePage.module.css';

// ── Icons ────────────────────────────────────────────────────────────────────

function FileTextSmallIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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

function TrashIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
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

function ChevronDownSmallIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

function CheckSmallIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 6.5L4.5 9 10 3.5" />
    </svg>
  );
}

// ── Track dropdown ────────────────────────────────────────────────────────────

const TRACK_OPTIONS: { value: Track; label: string; subheadline: string }[] = [
  { value: 'standard', label: 'Standard', subheadline: 'Faster, with less token usage' },
  { value: 'rigorous', label: 'Rigorous', subheadline: 'A thorough review that stress-tests your idea' },
];

function TrackDropdown({ value, onChange }: { value: Track; onChange: (track: Track) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onOutsideClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onOutsideClick);
    return () => document.removeEventListener('mousedown', onOutsideClick);
  }, [open]);

  const selected = TRACK_OPTIONS.find(o => o.value === value) ?? TRACK_OPTIONS[0];

  return (
    <div className={styles.trackDropdown} ref={ref}>
      <button
        type="button"
        className={styles.trackDropdownTrigger}
        onClick={() => setOpen(o => !o)}
      >
        <span className={styles.trackDropdownLabel}>{selected.label}</span>
        <span className={`${styles.trackDropdownChevron} ${open ? styles.trackDropdownChevronOpen : ''}`}>
          <ChevronDownSmallIcon />
        </span>
      </button>

      {open && (
        <div className={styles.trackDropdownPanel}>
          {TRACK_OPTIONS.map(opt => {
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                className={`${styles.trackDropdownRow} ${isSelected ? styles.trackDropdownRowSelected : ''}`}
                onClick={() => { onChange(opt.value); setOpen(false); }}
              >
                <div className={styles.trackDropdownRowText}>
                  <span className={styles.trackDropdownRowLabel}>{opt.label}</span>
                  <span className={styles.trackDropdownRowSub}>{opt.subheadline}</span>
                </div>
                {isSelected && <span className={styles.trackDropdownCheck}><CheckSmallIcon /></span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Stage-entry dropdown (Modular: jump directly to any stage) ───────────────

const STAGE_ENTRY_OPTIONS: { value: StageId; label: string }[] = STAGE_ORDER.map(id => ({
  value: id,
  label: STAGE_CONFIG[id].label,
}));

function StageEntryDropdown({ value, onChange }: { value: StageId; onChange: (stage: StageId) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onOutsideClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onOutsideClick);
    return () => document.removeEventListener('mousedown', onOutsideClick);
  }, [open]);

  const selected = STAGE_ENTRY_OPTIONS.find(o => o.value === value) ?? STAGE_ENTRY_OPTIONS[0];

  return (
    <div className={`${styles.trackDropdown} ${styles.stageEntryDropdown}`} ref={ref}>
      <button
        type="button"
        className={styles.trackDropdownTrigger}
        onClick={() => setOpen(o => !o)}
      >
        <span className={styles.trackDropdownLabel}>{selected.label}</span>
        <span className={`${styles.trackDropdownChevron} ${open ? styles.trackDropdownChevronOpen : ''}`}>
          <ChevronDownSmallIcon />
        </span>
      </button>

      {open && (
        <div className={styles.trackDropdownPanel}>
          {STAGE_ENTRY_OPTIONS.map(opt => {
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                className={`${styles.trackDropdownRow} ${isSelected ? styles.trackDropdownRowSelected : ''}`}
                onClick={() => { onChange(opt.value); setOpen(false); }}
              >
                <div className={styles.trackDropdownRowText}>
                  <span className={styles.trackDropdownRowLabel}>{opt.label}</span>
                </div>
                {isSelected && <span className={styles.trackDropdownCheck}><CheckSmallIcon /></span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
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
  const createPipeline        = usePipelineStore(s => s.createPipeline);
  const createModularPipeline = usePipelineStore(s => s.createModularPipeline);
  const hydratePipeline       = usePipelineStore(s => s.hydratePipeline);
  const setBackendProjectId   = usePipelineStore(s => s.setBackendProjectId);

  const [text, setText]             = useState('');
  const [files, setFiles]           = useState<File[]>([]);
  const [track, setTrack]           = useState<Track>('standard');
  const [selectedStage, setSelectedStage] = useState<StageId>('input');
  const [isCreating, setIsCreating] = useState(false);
  const [activeTab, setActiveTab]   = useState<string>('data');
  const [recentProjects, setRecentProjects] = useState<BackendProject[]>([]);
  const [pendingDelete, setPendingDelete]   = useState<BackendProject | null>(null);
  const [skipConfirm, setSkipConfirm]       = useState(
    () => localStorage.getItem('denario-skip-delete-confirm') === 'true'
  );
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

  const isModular = selectedStage !== 'input';
  const modularEntry = STAGE_CONFIG[selectedStage].modularEntry;
  const isAttached = files.length > 0;
  const hasText = text.trim().length > 0;
  const hasRequiredInput = modularEntry.requiresFile ? isAttached : hasText;
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
    const picked = Array.from(e.target.files ?? []);
    if (picked.length === 0) return;
    setFiles(prev => [...prev, ...picked]);
    // reset so the same file(s) can be re-attached after dismiss
    e.target.value = '';
  }

  function removeFile(index: number) {
    setFiles(prev => prev.filter((_, i) => i !== index));
  }

  function handleDeleteClick(project: BackendProject, e: React.MouseEvent) {
    e.stopPropagation();
    if (skipConfirm) {
      void executeDelete(project);
    } else {
      setPendingDelete(project);
    }
  }

  async function executeDelete(project: BackendProject) {
    try {
      await api.deleteProject(project.id);
      setRecentProjects(prev => prev.filter(p => p.id !== project.id));
    } catch {
      // silently ignore — server may be down
    } finally {
      setPendingDelete(null);
    }
  }

  function handleConfirmDelete(dontAsk: boolean) {
    if (dontAsk) {
      localStorage.setItem('denario-skip-delete-confirm', 'true');
      setSkipConfirm(true);
    }
    if (pendingDelete) void executeDelete(pendingDelete);
  }

  function handleCancelDelete() {
    setPendingDelete(null);
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
    if (!hasRequiredInput || isCreating) return;
    setIsCreating(true);

    const inputFiles = files.map(f => ({ name: f.name, size: formatBytes(f.size) }));
    const frontendId = isModular
      ? createModularPipeline(selectedStage, text, inputFiles, track)
      : createPipeline(text, inputFiles, track);

    // Create the backend project so stageRunner has an ID ready on first Generate.
    // If the server is down this is a no-op — stageRunner will retry lazily.
    // Navigate using the real backend id (not the synthetic frontendId) whenever
    // we have one, so the URL stays resolvable by api.getProject() on refresh.
    let navigateId = frontendId;
    try {
      const project = await api.createProject(
        text.trim().split(/\s+/).slice(0, 4).join('-').toLowerCase().replace(/[^a-z0-9-]/g, '') || 'new-project',
        text,
      );
      setBackendProjectId(project.id);
      const currentPipeline = usePipelineStore.getState().pipeline;
      if (currentPipeline) {
        usePipelineStore.getState().setPipeline({ ...currentPipeline, id: project.id });
      }
      navigateId = project.id;
      if (files.length > 0) {
        await api.uploadFiles(project.id, files).catch(() => {
          // upload failed — the project still exists, just without the real file paths appended
        });
      }
    } catch {
      // backend unavailable — proceed anyway with the synthetic id; refresh
      // won't survive until a backend project eventually gets created.
    }

    navigate(`/project/${navigateId}/stage/${selectedStage}`);
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

            {/* Stage entry — Pipeline (default) or Modular (jump to any stage) */}
            <div className={styles.stageEntryRow}>
              <StageEntryDropdown value={selectedStage} onChange={setSelectedStage} />
            </div>

            {/* Heading */}
            <div className={`${styles.promptHeader} ${isAttached ? styles.promptHeaderAttached : ''}`}>
              <h1 className={styles.promptHeading}>{modularEntry.headline}</h1>
              <p className={styles.promptSub}>{modularEntry.subheader}</p>
            </div>

            {/* File chip — shown when file attached */}
            {isAttached && (
              <div className={styles.fileChipRow}>
                {files.map((f, i) => (
                  <div key={`${f.name}-${i}`} className={styles.fileChip}>
                    <FileTextSmallIcon />
                    <span className={styles.fileChipName}>{f.name}</span>
                    <div className={styles.fileChipDivider} />
                    <span className={styles.fileChipSize}>{formatBytes(f.size)}</span>
                    <button
                      className={styles.fileChipDismiss}
                      aria-label={`Remove ${f.name}`}
                      onClick={() => removeFile(i)}
                    >
                      <XSmallIcon />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Input card */}
            <div className={`${styles.inputCard} ${isAttached ? styles.inputCardAttached : ''}`}>
              <textarea
                className={styles.inputArea}
                placeholder={modularEntry.placeholder}
                rows={isAttached ? 4 : 3}
                value={text}
                onChange={e => setText(e.target.value)}
              />

              {/* Tool suggestions */}
              {modularEntry.showToolPreferences && (
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
              )}

              <div className={styles.inputCardFooter}>
                <div className={styles.attachBtnWrapper}>
                  <button
                    className={`${styles.attachBtn} ${modularEntry.requiresFile && !isAttached ? styles.attachBtnRequired : ''}`}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <PaperclipIcon />
                    <span>
                      {isAttached
                        ? 'Attach another file'
                        : modularEntry.requiresFile ? modularEntry.fileHint : 'Attach file'}
                    </span>
                  </button>
                  <div className={styles.attachTooltip}>
                    {modularEntry.requiresFile && !isAttached ? 'Required for this stage · up to 200MB per file' : 'Up to 200MB per file'}
                  </div>
                </div>

                <div className={styles.beginGroup}>
                  <TrackDropdown value={track} onChange={setTrack} />
                  <button
                    className={`${styles.beginBtn} ${isAttached ? styles.beginBtnAttached : ''}`}
                    onClick={handleBegin}
                    disabled={!hasRequiredInput || isCreating}
                    style={{ opacity: hasRequiredInput && !isCreating ? 1 : 0.45, cursor: hasRequiredInput && !isCreating ? 'pointer' : 'default' }}
                  >
                    {isCreating ? 'Starting…' : `${modularEntry.cta} →`}
                  </button>
                </div>
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
              multiple
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
                        <div className={styles.projectTitleGroup}>
                          <span className={styles.projectName}>{project.name}</span>
                          <span className={styles.projectStageSubheader}>Stage {deriveStageLabel(project)}</span>
                        </div>
                      </div>
                      <div className={styles.projectRight}>
                        <span className={styles.lastOpened}>{relativeTime(project.updated_at)}</span>
                        <button
                          className={styles.continueLink}
                          onClick={() => handleContinue(project)}
                        >
                          Open
                        </button>
                        <button
                          className={styles.deleteBtn}
                          aria-label="Delete project"
                          onClick={e => handleDeleteClick(project, e)}
                        >
                          <TrashIcon />
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

      {pendingDelete && (
        <DeleteConfirmDialog
          projectName={pendingDelete.name}
          onConfirm={handleConfirmDelete}
          onCancel={handleCancelDelete}
        />
      )}
    </div>
  );
}

// ── Delete confirmation dialog ─────────────────────────────────────────────────

function DeleteConfirmDialog({
  projectName,
  onConfirm,
  onCancel,
}: {
  projectName: string;
  onConfirm: (dontAsk: boolean) => void;
  onCancel: () => void;
}) {
  const [dontAsk, setDontAsk] = useState(false);

  return (
    <div className={styles.dialogOverlay} onClick={onCancel}>
      <div className={styles.dialog} onClick={e => e.stopPropagation()}>
        <p className={styles.dialogTitle}>Delete this project?</p>
        <p className={styles.dialogBody}>
          <strong>{projectName}</strong> and all its files will be permanently removed. This can't be undone.
        </p>
        <label className={styles.dialogCheckLabel}>
          <input
            type="checkbox"
            checked={dontAsk}
            onChange={e => setDontAsk(e.target.checked)}
            className={styles.dialogCheckbox}
          />
          Don't ask me again
        </label>
        <div className={styles.dialogActions}>
          <button className={styles.dialogCancelBtn} onClick={onCancel}>Cancel</button>
          <button className={styles.dialogDeleteBtn} onClick={() => onConfirm(dontAsk)}>Delete</button>
        </div>
      </div>
    </div>
  );
}
