import { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { InlineMarkdown } from '../../utils/MarkdownBlock';
import { STAGE_CONFIG } from '../../config/stageConfig';
import { usePipelineStore } from '../../store/pipelineStore';
import { api } from '../../api/client';
import { PlotLightbox } from '../../components/PlotLightbox/PlotLightbox';
import type {
  StageId,
  StageStatus,
  StageResult,
  IdeaResultData,
  MethodsResultData,
  AnalysisResultData,
  PaperResultData,
  LiteratureResultData,
  RefereeResultData,
  KeywordsResultData,
} from '../../types/pipeline';
import styles from './StagePage.module.css';

// ── Constants ─────────────────────────────────────────────────────────────────

const STAGE_ORDER: StageId[] = [
  'input', 'idea', 'methods', 'analysis', 'paper', 'literature', 'referee', 'keywords',
];

const PANEL_MIN     = 300;
const PANEL_DEFAULT = 340;
const PANEL_WIDE    = 640;

// ── Dropdown icons ────────────────────────────────────────────────────────────

function ChevronDownIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 6.5L4.5 9 10 3.5" />
    </svg>
  );
}

// ── Stage dropdown ────────────────────────────────────────────────────────────

function StageDropdown({
  statuses,
  selected,
  onChange,
}: {
  statuses: Record<StageId, StageStatus>;
  selected: StageId;
  onChange: (stageId: StageId) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onOutsideClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onOutsideClick);
    return () => document.removeEventListener('mousedown', onOutsideClick);
  }, [open]);

  return (
    <div className={styles.stageDropdown} ref={ref}>
      <button
        type="button"
        className={styles.stageDropdownTrigger}
        onClick={() => setOpen(o => !o)}
      >
        <span className={`${styles.stageDropdownChevron} ${open ? styles.stageDropdownChevronOpen : ''}`}>
          <ChevronDownIcon />
        </span>
        <span className={styles.stageDropdownLabel}>{STAGE_CONFIG[selected].label}</span>
      </button>

      {open && (
        <div className={styles.stageDropdownPanel}>
          {STAGE_ORDER.map(sid => {
            const status     = statuses[sid] ?? 'locked';
            const isSelected = sid === selected;
            const locked     = status === 'locked';
            return (
              <button
                key={sid}
                type="button"
                className={[
                  styles.stageDropdownRow,
                  isSelected ? styles.stageDropdownRowSelected : '',
                  locked     ? styles.stageDropdownRowLocked   : '',
                ].join(' ')}
                disabled={locked}
                onClick={() => { onChange(sid); setOpen(false); }}
              >
                {isSelected && (
                  <span className={styles.stageDropdownCheck}><CheckIcon /></span>
                )}
                <span className={styles.stageDropdownRowLabel}>{STAGE_CONFIG[sid].label}</span>
                {status === 'error' && <span className={styles.stageDropdownRowError}>!</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState({ status }: { status: StageStatus }) {
  const msg =
    status === 'locked'  ? 'This stage is locked.'  :
    status === 'idle'    ? 'Not generated yet.'      :
    status === 'running' ? 'Running…'                : '';
  return (
    <div className={styles.panelEmptyState}>
      <p className={styles.panelEmptyMsg}>{msg}</p>
    </div>
  );
}

// ── Download icon ─────────────────────────────────────────────────────────────

function DownloadIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

// ── Reading views (per stage, no card chrome) ─────────────────────────────────

function IdeaReadingView({ result }: { result: StageResult }) {
  const data = result.stageData as IdeaResultData | undefined;
  const hypothesis = data?.hypothesis ?? result.content;
  const scopeNote  = data?.scopeNote;
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();

  function handleOpenFull() {
    if (projectId) navigate(`/project/${projectId}/stage/${result.stageId}/full`);
  }

  return (
    <div className={styles.readingView}>
      <p className={styles.readingTitle}>{result.title}</p>
      <p className={styles.readingProse}>{hypothesis}</p>
      {scopeNote && (
        <>
          <p className={styles.readingScopeNote}>
            {typeof scopeNote === 'string' ? scopeNote : `${scopeNote.title} — ${scopeNote.body}`}
          </p>
          <button className={styles.readingOpenFullBtn} onClick={handleOpenFull}>
            Open full →
          </button>
        </>
      )}
    </div>
  );
}

function MethodsReadingView({ result }: { result: StageResult }) {
  const data     = result.stageData as MethodsResultData | undefined;
  const sections = data?.sections ?? [];
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();

  function handleOpenFull() {
    if (projectId) navigate(`/project/${projectId}/stage/${result.stageId}/full`);
  }

  return (
    <div className={styles.readingView}>
      <p className={styles.readingTitle}>{result.title}</p>
      <button className={styles.readingOpenFullBtn} onClick={handleOpenFull}>
        Open full →
      </button>
      <div className={styles.readingSectionList}>
        {sections.map(section => (
          <div key={section.number} className={styles.readingSection}>
            <p className={styles.readingSectionTitle}>{section.number}. {section.title}</p>
            <div className={styles.readingStepList}>
              {section.substeps.map(({ number, label, body, points, code }) => (
                <div key={number} className={styles.readingStepItem}>
                  <div className={styles.readingStepTop}>
                    <span className={styles.readingStepNum}>{number}</span>
                    <span className={styles.readingStepLabel}>{label}</span>
                  </div>
                  {body && <p className={styles.readingStepDesc}><InlineMarkdown text={body} /></p>}
                  {points.length > 0 && (
                    <ul className={styles.readingStepPointList}>
                      {points.map((pt, pi) => (
                        <li key={pi} className={styles.readingStepPoint}><InlineMarkdown text={pt.text} /></li>
                      ))}
                    </ul>
                  )}
                  {code && <pre className={styles.readingStepCode}><code>{code}</code></pre>}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AnalysisReadingView({ result }: { result: StageResult }) {
  const data    = result.stageData as AnalysisResultData | undefined;
  const stats   = data?.stats ?? {};
  const plots   = data?.plots ?? [];
  const backendId = usePipelineStore(s => s.backendProjectId);
  const [lbOpen, setLbOpen]   = useState(false);
  const [lbIdx, setLbIdx]     = useState(0);

  const statItems = [
    { label: 'Pearson r',   value: stats.pearsonR   ?? '—' },
    { label: 'Spearman ρ',  value: stats.spearmanR  ?? '—' },
    { label: 'R²',          value: stats.rSquared   ?? '—' },
    { label: 'p-value',     value: stats.pValue     ?? '—' },
  ].filter(s => s.value !== '—');

  return (
    <div className={styles.readingView}>
      {statItems.length > 0 && (
        <div className={styles.readingStatsRow}>
          {statItems.map(({ label, value }) => (
            <div key={label} className={styles.readingStat}>
              <span className={styles.readingStatValue}>{String(value)}</span>
              <span className={styles.readingStatLabel}>{label}</span>
            </div>
          ))}
        </div>
      )}
      <p className={styles.readingProse}>{result.content}</p>
      {plots.length > 0 && (
        <>
          <p className={styles.readingSectionLabel}>Outputs</p>
          <div className={styles.readingPlotGrid}>
            {plots.map((name, i) => (
              <button
                key={name}
                className={styles.readingPlotThumb}
                onClick={() => { setLbIdx(i); setLbOpen(true); }}
                title={name}
              >
                <span className={styles.readingPlotName}>{name.replace(/\.png$/, '')}</span>
              </button>
            ))}
          </div>
        </>
      )}
      {lbOpen && plots.length > 0 && (
        <PlotLightbox
          plots={plots}
          currentIndex={lbIdx}
          onClose={() => setLbOpen(false)}
          onNavigate={setLbIdx}
          backendProjectId={backendId}
        />
      )}
    </div>
  );
}

function PaperReadingView({ result }: { result: StageResult }) {
  const data     = result.stageData as PaperResultData | undefined;
  const abstract = data?.abstract || result.content;
  const cites    = data?.citations ?? 0;

  return (
    <div className={styles.readingView}>
      <p className={styles.readingTitle}>{result.title}</p>
      {cites > 0 && (
        <p className={styles.readingMeta}>{cites} citation{cites === 1 ? '' : 's'}</p>
      )}
      <p className={styles.readingSectionLabel}>Abstract</p>
      <p className={styles.readingProse}>{abstract}</p>
    </div>
  );
}

function LiteratureReadingView({ result }: { result: StageResult }) {
  const data = result.stageData as LiteratureResultData | undefined;
  const structured = data?.structured;

  return (
    <div className={styles.readingView}>
      {structured?.decision && <p className={styles.readingMeta}>{structured.decision}</p>}
      <p className={styles.readingProse}><InlineMarkdown text={structured?.assessment || result.rawContent || result.content || ''} /></p>
      {structured && structured.papers.length > 0 && (
        <p className={styles.readingMeta}>{structured.papers.length} paper{structured.papers.length === 1 ? '' : 's'} compared</p>
      )}
    </div>
  );
}

function RefereeReadingView({ result }: { result: StageResult }) {
  const data = result.stageData as RefereeResultData | undefined;
  const structured = data?.structured;

  return (
    <div className={styles.readingView}>
      {structured?.score && <p className={styles.readingMeta}>Score: {structured.score}</p>}
      <p className={styles.readingProse}><InlineMarkdown text={structured?.sections.find(s => /overall|assessment|summary/i.test(s.title))?.body || result.rawContent || result.content || ''} /></p>
    </div>
  );
}

function KeywordsReadingView({ result }: { result: StageResult }) {
  const data     = result.stageData as KeywordsResultData | undefined;
  const keywords = data?.structured?.keywords ?? [];

  return (
    <div className={styles.readingView}>
      <div className={styles.readingKwChips}>
        {keywords.map(({ term, url }) => (
          url ? (
            <a key={term} href={url} target="_blank" rel="noreferrer" className={styles.readingKwChip}>{term}</a>
          ) : (
            <span key={term} className={styles.readingKwChip}>{term}</span>
          )
        ))}
      </div>
    </div>
  );
}

function InputReadingView() {
  const inputText      = usePipelineStore(s => s.pipeline?.inputText ?? '');
  const preferredTools = usePipelineStore(s => s.pipeline?.preferredTools ?? '');

  return (
    <div className={styles.readingView}>
      <p className={styles.readingTitle}>Data Description</p>
      <p className={styles.readingProse}>{inputText}</p>
      {preferredTools && (
        <>
          <p className={styles.readingSectionLabel}>Preferred tools</p>
          <p className={styles.readingProse}>{preferredTools}</p>
        </>
      )}
    </div>
  );
}

function GenericReadingView({ result }: { result: StageResult }) {
  return (
    <div className={styles.readingView}>
      {result.title && <p className={styles.readingTitle}>{result.title}</p>}
      <p className={styles.readingProse}>{result.content}</p>
    </div>
  );
}

function PanelReadingView({ stageId }: { stageId: StageId }) {
  const result = usePipelineStore(s => s.pipeline?.stages[stageId]?.result);

  if (stageId === 'input') return <InputReadingView />;
  if (!result) return null;

  switch (stageId) {
    case 'idea':       return <IdeaReadingView result={result} />;
    case 'methods':    return <MethodsReadingView result={result} />;
    case 'analysis':   return <AnalysisReadingView result={result} />;
    case 'paper':      return <PaperReadingView result={result} />;
    case 'literature': return <LiteratureReadingView result={result} />;
    case 'referee':    return <RefereeReadingView result={result} />;
    case 'keywords':   return <KeywordsReadingView result={result} />;
    default:           return <GenericReadingView result={result} />;
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

interface RightPanelProps {
  stageId: StageId;
}

export function RightPanel({ stageId: activeStageId }: RightPanelProps) {
  const { projectId: _projectId } = useParams<{ projectId: string }>();
  const pipeline  = usePipelineStore(s => s.pipeline);
  const backendId = usePipelineStore(s => s.backendProjectId);

  const [selected, setSelected]     = useState<StageId>(activeStageId);
  const [panelWidth, setPanelWidth] = useState(PANEL_DEFAULT);
  const [dragging, setDragging]     = useState(false);

  useEffect(() => { setSelected(activeStageId); }, [activeStageId]);

  // ── Drag-to-resize ──────────────────────────────────────────────────────────
  const startResize = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const startX     = e.clientX;
    const startWidth = panelWidth;
    setDragging(true);

    function onMove(ev: MouseEvent) {
      const delta    = startX - ev.clientX;
      const newWidth = Math.max(PANEL_MIN, Math.min(PANEL_WIDE, startWidth + delta));
      setPanelWidth(newWidth);
    }
    function onUp() {
      setDragging(false);
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    }
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, [panelWidth]);

  function handleResizeDblClick() {
    setPanelWidth(w => w < (PANEL_DEFAULT + PANEL_WIDE) / 2 ? PANEL_WIDE : PANEL_DEFAULT);
  }

  if (!pipeline) return null;

  const stage  = pipeline.stages[selected];
  const result = stage?.result;
  const file   = result?.file;

  const stageStatuses = Object.fromEntries(
    STAGE_ORDER.map(sid => [sid, pipeline.stages[sid]?.status ?? 'locked'])
  ) as Record<StageId, StageStatus>;

  return (
    <div className={styles.rightPanelShell}>
      <aside
        className={`${styles.rightPanel} ${dragging ? styles.rightPanelDragging : ''}`}
        style={{ width: panelWidth }}
      >
        {/* Drag handle */}
        <div
          className={styles.resizeHandle}
          onMouseDown={startResize}
          onDoubleClick={handleResizeDblClick}
          title="Drag to resize · Double-click to snap"
        />

        <div className={styles.cardBody}>
          {/* Stage dropdown + download */}
          <div className={styles.panelTopRow}>
            <StageDropdown
              statuses={stageStatuses}
              selected={selected}
              onChange={setSelected}
            />
            {backendId && file && (
              <a
                className={styles.panelDownloadBtn}
                href={api.fileUrl(backendId, file)}
                download={file}
                title={`Download ${file}`}
              >
                <DownloadIcon />
              </a>
            )}
          </div>

          {/* Content */}
          <div className={styles.panelDividerLine} />
          <div className={styles.panelContent}>
            {result ? (
              <PanelReadingView stageId={selected} />
            ) : (
              <EmptyState status={stage?.status ?? 'locked'} />
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}
