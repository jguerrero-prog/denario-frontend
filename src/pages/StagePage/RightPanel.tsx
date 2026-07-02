import { useState, useCallback, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { STAGE_CONFIG } from '../../config/stageConfig';
import { usePipelineStore } from '../../store/pipelineStore';
import { api } from '../../api/client';
import { PlotLightbox } from '../../components/PlotLightbox/PlotLightbox';
import { PdfPage, TexEditor, TexFileTab, TEX_INITIAL } from '../PaperFullPage/PaperFullPage';
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

const STAGE_SHORT: Record<StageId, string> = {
  input:      'Input',
  idea:       'Idea',
  methods:    'Methods',
  analysis:   'Analysis',
  paper:      'Paper',
  literature: 'Lit.',
  referee:    'Referee',
  keywords:   'Keywords',
};

const PANEL_MIN     = 300;
const PANEL_DEFAULT = 340;
const PANEL_WIDE    = 640;
const PANEL_FULL    = 520; // threshold: show embedded full view for paper

// ── Pill ──────────────────────────────────────────────────────────────────────

function StagePill({
  stageId,
  status,
  selected,
  onClick,
}: {
  stageId: StageId;
  status: StageStatus;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={[
        styles.stagePill2,
        selected              ? styles.stagePill2Selected : '',
        status === 'complete' ? styles.stagePill2Done     : '',
        status === 'locked'   ? styles.stagePill2Locked   : '',
        status === 'error'    ? styles.stagePill2Error    : '',
      ].join(' ')}
      onClick={onClick}
      disabled={status === 'locked'}
      title={STAGE_CONFIG[stageId].label}
    >
      {STAGE_SHORT[stageId]}
    </button>
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

  return (
    <div className={styles.readingView}>
      <p className={styles.readingTitle}>{result.title}</p>
      <p className={styles.readingProse}>{hypothesis}</p>
      {scopeNote && (
        <p className={styles.readingScopeNote}>{scopeNote}</p>
      )}
    </div>
  );
}

function MethodsReadingView({ result }: { result: StageResult }) {
  const data  = result.stageData as MethodsResultData | undefined;
  const steps = data?.steps ?? [];

  return (
    <div className={styles.readingView}>
      <p className={styles.readingTitle}>{result.title}</p>
      <div className={styles.readingStepList}>
        {steps.map(({ n, label, tool, description }) => (
          <div key={n} className={styles.readingStepItem}>
            <div className={styles.readingStepTop}>
              <span className={styles.readingStepNum}>{n}</span>
              <span className={styles.readingStepLabel}>{label}</span>
              {tool && <span className={styles.readingToolChip}>{tool}</span>}
            </div>
            {description && (
              <p className={styles.readingStepDesc}>{description}</p>
            )}
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
  const abstract = data?.abstract ?? result.content;
  const journal  = data?.journal  ?? '';
  const pages    = data?.pdfFile?.pages  ?? '—';
  const cites    = data?.citations ?? '—';

  return (
    <div className={styles.readingView}>
      <p className={styles.readingTitle}>{result.title}</p>
      {journal && (
        <p className={styles.readingMeta}>{journal.toUpperCase()} · {String(pages)} pp · {String(cites)} refs</p>
      )}
      <p className={styles.readingSectionLabel}>Abstract</p>
      <p className={styles.readingProse}>{abstract}</p>
    </div>
  );
}

function LiteratureReadingView({ result }: { result: StageResult }) {
  const data    = result.stageData as LiteratureResultData | undefined;
  const scanned = data?.totalScanned ?? 0;
  const overlap = data?.overlapCounts ?? { high: 0, gaps: 0, conflicts: 0 };
  const studies = data?.highOverlapStudies ?? [];

  return (
    <div className={styles.readingView}>
      <p className={styles.readingMeta}>{scanned} papers scanned</p>
      <div className={styles.readingOverlapRow}>
        <span className={styles.readingOverlapAmber}>{overlap.high} high-overlap</span>
        <span className={styles.readingOverlapBlue}>{overlap.gaps} citation gaps</span>
        <span className={styles.readingOverlapRed}>{overlap.conflicts} conflicts</span>
      </div>
      {studies.length > 0 && (
        <>
          <p className={styles.readingSectionLabel}>High-overlap studies</p>
          <div className={styles.readingStudyList}>
            {studies.map(({ pct, title, venue }) => (
              <div key={pct} className={styles.readingStudyItem}>
                <span className={styles.readingStudyPct}>{pct}</span>
                <div className={styles.readingStudyInfo}>
                  <span className={styles.readingStudyTitle}>{title}</span>
                  {venue && <span className={styles.readingStudyVenue}>{venue}</span>}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function RefereeReadingView({ result }: { result: StageResult }) {
  const data     = result.stageData as RefereeResultData | undefined;
  const verdict  = data?.verdict ?? { recommendation: result.content, chip: 'Revision' };
  const comments = data?.comments ?? [];

  return (
    <div className={styles.readingView}>
      <div className={styles.readingVerdictRow}>
        <p className={styles.readingProse}>{verdict.recommendation}</p>
        <span className={styles.readingVerdictChip}>{verdict.chip}</span>
      </div>
      {comments.length > 0 && (
        <>
          <p className={styles.readingSectionLabel}>Reviewer comments</p>
          <div className={styles.readingCommentList}>
            {comments.map(({ id, label, text }) => (
              <div key={id} className={styles.readingCommentItem}>
                <div className={styles.readingCommentHeader}>
                  <span className={styles.readingCommentLabel}>{label}</span>
                  <span className={styles.readingCommentId}>{id}</span>
                </div>
                <p className={styles.readingCommentText}>{text}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function KeywordsReadingView({ result }: { result: StageResult }) {
  const data   = result.stageData as KeywordsResultData | undefined;
  const groups = data?.groups ?? [];

  return (
    <div className={styles.readingView}>
      {groups.map(({ heading, terms }) => (
        <div key={heading} className={styles.readingKwGroup}>
          <p className={styles.readingSectionLabel}>{heading}</p>
          <div className={styles.readingKwChips}>
            {terms.map(term => (
              <span key={term} className={styles.readingKwChip}>{term}</span>
            ))}
          </div>
        </div>
      ))}
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

// ── Paper full view embedded in panel ─────────────────────────────────────────

function PaperPanelView({
  data,
  title,
}: {
  data: PaperResultData | undefined;
  title: string;
}) {
  const [view, setView]             = useState<'pdf' | 'tex'>('pdf');
  const [texContent, setTexContent] = useState(TEX_INITIAL);

  return (
    <div className={styles.panelFullView}>
      <div className={styles.panelTabRow}>
        <button
          className={`${styles.panelTab} ${view === 'pdf' ? styles.panelTabActive : ''}`}
          onClick={() => setView('pdf')}
        >
          PDF
        </button>
        <button
          className={`${styles.panelTab} ${view === 'tex' ? styles.panelTabActive : ''}`}
          onClick={() => setView('tex')}
        >
          LaTeX
        </button>
      </div>

      {view === 'pdf' ? (
        <div className={styles.panelPdfScroll}>
          <PdfPage data={data} pageTitle={title} />
        </div>
      ) : (
        <div className={styles.panelTexWrap}>
          <TexFileTab texFile={data?.texFile} />
          <div className={styles.panelTexEditor}>
            <TexEditor content={texContent} onChange={setTexContent} />
          </div>
        </div>
      )}
    </div>
  );
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

  const paperData  = selected === 'paper'
    ? result?.stageData as PaperResultData | undefined
    : undefined;
  const paperTitle = result?.title ?? 'Temporal Correlation Between Atmospheric CO₂ and Surface Temperature Anomalies';

  const showFullView = selected === 'paper' && !!result && panelWidth >= PANEL_FULL;

  return (
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

      {/* Stage pills */}
      <div className={styles.pillRow}>
        {STAGE_ORDER.map(sid => (
          <StagePill
            key={sid}
            stageId={sid}
            status={pipeline.stages[sid]?.status ?? 'locked'}
            selected={sid === selected}
            onClick={() => setSelected(sid)}
          />
        ))}
      </div>

      {/* Stage header — hidden when paper full view active */}
      {!showFullView && (
        <div className={styles.panelStageHeader}>
          <div className={styles.panelStageHeaderLeft}>
            <span className={styles.panelStageLabel}>{STAGE_CONFIG[selected].label}</span>
            {file && <span className={styles.panelStageFile}>{file}</span>}
          </div>
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
      )}

      {/* Content */}
      {showFullView ? (
        <PaperPanelView data={paperData} title={paperTitle} />
      ) : (
        <div className={styles.panelContent}>
          {result ? (
            <PanelReadingView stageId={selected} />
          ) : (
            <EmptyState status={stage?.status ?? 'locked'} />
          )}
        </div>
      )}
    </aside>
  );
}
