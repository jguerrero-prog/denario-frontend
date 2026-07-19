import { useState } from 'react';
import { useNavigate, useParams, Navigate } from 'react-router-dom';
import { Sidebar } from '../../components/organisms/Sidebar/Sidebar';
import { PlotLightbox } from '../../components/PlotLightbox/PlotLightbox';
import { usePipelineStore } from '../../store/pipelineStore';
import { useHydratedPipeline } from '../../hooks/useHydratedPipeline';
import { InlineMarkdown } from '../../utils/MarkdownBlock';
import { api } from '../../api/client';
import type { AnalysisResultData, ResultSection, ResultTable } from '../../types/pipeline';
import styles from './AnalysisFullPage.module.css';

// ── Structured report rendering ────────────────────────────────────────────────
// Renders denario/results_parser.py's dynamically-parsed structure. Every piece
// is optional by design (see StructuredResults' own docstring) — a report
// missing tables, or subsections, or an artifacts section just renders without
// that piece, rather than assuming every results.md has the same shape.

function ReportTable({ table }: { table: ResultTable }) {
  return (
    <div className={styles.tableWrap}>
      {table.caption && <p className={styles.tableCaption}>{table.caption}</p>}
      <table className={styles.reportTable}>
        <thead>
          <tr>
            {table.columns.map((c, i) => <th key={i}><InlineMarkdown text={c} /></th>)}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row, ri) => (
            <tr key={ri}>
              {row.map((cell, ci) => <td key={ci}><InlineMarkdown text={cell} /></td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ReportSection({ section }: { section: ResultSection }) {
  return (
    <div className={styles.section}>
      <p className={styles.sectionLabel}>{section.number ? `${section.number}. ` : ''}{section.title}</p>
      {section.body && <p className={styles.prose}><InlineMarkdown text={section.body} /></p>}
      {section.findings.length > 0 && (
        <ul className={styles.findingsList}>
          {section.findings.map((f, i) => (
            <li key={i}><strong>{f.label}</strong>{f.detail ? `: ${f.detail}` : ''}</li>
          ))}
        </ul>
      )}
      {section.tables.map((t, i) => <ReportTable key={i} table={t} />)}
      {section.subsections.map((sub, i) => (
        <div key={i} className={styles.subsection}>
          <p className={styles.subsectionLabel}>{sub.number ? `${sub.number} ` : ''}{sub.title}</p>
          {sub.body && <p className={styles.prose}><InlineMarkdown text={sub.body} /></p>}
        </div>
      ))}
    </div>
  );
}

// ── Icons ─────────────────────────────────────────────────────────────────────

function ChevronLeftIcon() {
  return (
    <svg className={styles.backChevron} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7.5 2.5L4 6l3.5 3.5" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4.5" y="4.5" width="7" height="7" rx="1" />
      <path d="M2.5 9.5V2.5h7" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 2v7M4.5 6.5L7 9l2.5-2.5" />
      <path d="M2 11h10" />
    </svg>
  );
}

function FileIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.5 1.5H4A1.5 1.5 0 0 0 2.5 3v10A1.5 1.5 0 0 0 4 14.5h8A1.5 1.5 0 0 0 13.5 13V5.5l-4-4Z" />
      <path d="M9.5 1.5V5.5H13.5" />
    </svg>
  );
}

function ChartBarIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
      <rect x="2" y="10" width="4" height="8" rx="1" fill="var(--color-text-sec)" />
      <rect x="8" y="6" width="4" height="12" rx="1" fill="var(--color-text-sec)" />
      <rect x="14" y="2" width="4" height="16" rx="1" fill="var(--color-text-sec)" />
    </svg>
  );
}

// Real image thumbnail, same pattern as ResultCards.tsx's PlotThumb — falls
// back to the icon+filename placeholder only if the image genuinely fails
// to load (or there's no backend project id to resolve it against yet).
function PlotThumb({ name, backendProjectId, onClick }: { name: string; backendProjectId?: string | null; onClick: () => void }) {
  const [failed, setFailed] = useState(false);
  const showImage = !!backendProjectId && !failed;

  return (
    <button className={styles.plotCell} onClick={onClick}>
      <div className={styles.plotCellInner}>
        {showImage ? (
          <img
            key={name}
            src={api.fileUrl(backendProjectId, `input_files/plots/${name}`)}
            alt={name}
            className={styles.plotCellImg}
            onError={() => setFailed(true)}
          />
        ) : (
          <ChartBarIcon />
        )}
      </div>
      <span className={styles.plotName}>{name}</span>
    </button>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export function AnalysisFullPage() {
  const navigate = useNavigate();
  const { projectId, stageId = 'analysis' } = useParams<{ projectId: string; stageId: string }>();
  const { pipeline, needsFetch, fetchFailed } = useHydratedPipeline(projectId);
  const result = pipeline?.stages['analysis']?.result;
  const data = result?.stageData as AnalysisResultData | undefined;
  const backendProjectId = usePipelineStore(s => s.backendProjectId);

  const file = result?.file ?? 'results.md';

  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIdx, setLightboxIdx] = useState(0);

  const plots = data?.plots ?? [];
  const visiblePlots = plots.slice(0, 3);
  const extraCount = plots.length - 3;

  function openLightbox(idx = 0) { setLightboxIdx(idx); setLightboxOpen(true); }

  function handleBack() {
    navigate(`/project/${projectId}/stage/${stageId}`);
  }

  function handleCopy() {
    navigator.clipboard.writeText(result?.rawContent ?? result?.content ?? '').catch(() => {});
  }

  if (fetchFailed) {
    return <Navigate to="/" replace />;
  }

  if (needsFetch) {
    return <div className={styles.layout} />;
  }

  return (
    <div className={styles.layout}>
      <Sidebar userEmail="researcher@lab.edu" />

      <main className={styles.main}>
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

            {/* Header: eyebrow (copy/download) + title + divider — same
                treatment as MethodsFullPage, not the old green-dot file badge. */}
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
              <h1 className={styles.docTitle}>{result?.title ?? 'Analysis Results'}</h1>
              <div className={styles.divider} />
            </div>

            {/* Visual Outputs — real plot thumbnails, same pattern as the
                compact Analysis card (PlotThumb), not a generic chart icon. */}
            {plots.length > 0 && (
              <div className={styles.section}>
                <p className={styles.sectionLabel}>Visual Outputs</p>
                <div className={styles.plotGrid}>
                  {visiblePlots.map((name, i) => (
                    <PlotThumb key={name} name={name} backendProjectId={backendProjectId} onClick={() => openLightbox(i)} />
                  ))}
                  {extraCount > 0 && (
                    <button className={`${styles.plotCell} ${styles.plotCellMore}`} onClick={() => openLightbox(3)}>
                      <div className={styles.plotCellInner}>
                        <span className={styles.plotMoreCount}>+{extraCount}</span>
                      </div>
                      <span className={styles.plotName}>more</span>
                    </button>
                  )}
                </div>
                <button className={styles.viewAllLink} onClick={() => openLightbox(0)}>
                  View all {plots.length} plots →
                </button>
              </div>
            )}

            <div className={styles.divider} />

            {/* Full Report — prefers the structured, dynamically-parsed
                report (denario/results_parser.py) when present: real headers,
                real HTML tables, real findings lists. Falls back to the raw
                markdown dump (older projects, no results.json sidecar yet)
                and finally to the short narrative snippet. */}
            {data?.structured ? (
              <>
                {data.structured.note && (
                  <div className={styles.section}>
                    <p className={styles.noteBlock}><InlineMarkdown text={data.structured.note} /></p>
                  </div>
                )}
                {data.structured.summary && (
                  <div className={styles.section}>
                    <p className={styles.sectionLabel}>Summary</p>
                    <p className={styles.prose}><InlineMarkdown text={data.structured.summary} /></p>
                  </div>
                )}
                {data.structured.sections.map((section, i) => (
                  <ReportSection key={i} section={section} />
                ))}
              </>
            ) : result?.rawContent ? (
              <div className={styles.section}>
                <p className={styles.sectionLabel}>Full Report</p>
                <pre className={styles.fullDocument}>{result.rawContent}</pre>
              </div>
            ) : data?.narrativeFindings && (
              <div className={styles.section}>
                <p className={styles.sectionLabel}>Narrative Findings</p>
                <p className={styles.prose}>{data.narrativeFindings}</p>
              </div>
            )}

            <div className={styles.divider} />

            {/* Generated Files — prefers structured.artifacts (real,
                categorized file references parsed from the report's own
                references section) over the generic generatedFiles mock. */}
            {data?.structured && data.structured.artifacts.length > 0 ? (
              <div className={styles.section}>
                <p className={styles.sectionLabel}>Generated Artifacts</p>
                {data.structured.artifacts.map((cat, i) => (
                  <div key={i} className={styles.artifactCategory}>
                    <p className={styles.artifactCategoryLabel}>{cat.label}</p>
                    <div className={styles.fileList}>
                      {cat.files.map(f => (
                        <div key={f} className={styles.fileRow}>
                          <div className={styles.fileRowLeft}>
                            <span className={styles.fileIconWrap}><FileIcon /></span>
                            <span className={styles.fileName}>{f}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : data?.generatedFiles && data.generatedFiles.length > 0 && (
              <div className={styles.section}>
                <p className={styles.sectionLabel}>Generated Files</p>
                <div className={styles.fileList}>
                  {data.generatedFiles.map(f => (
                    <div key={f.name} className={styles.fileRow}>
                      <div className={styles.fileRowLeft}>
                        <span className={styles.fileIconWrap}><FileIcon /></span>
                        <span className={styles.fileName}>{f.name}</span>
                        <span className={styles.fileSize}>{f.size}</span>
                      </div>
                      <button className={styles.downloadLink}>Download</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* End footer */}
            <div className={styles.endFooter}>
              <div className={styles.divider} />
              <p className={styles.endLabel}>End of {file}</p>
            </div>

          </div>
        </div>
      </main>

      {lightboxOpen && plots.length > 0 && (
        <PlotLightbox
          plots={plots}
          currentIndex={lightboxIdx}
          onClose={() => setLightboxOpen(false)}
          onNavigate={setLightboxIdx}
          backendProjectId={backendProjectId}
        />
      )}
    </div>
  );
}
