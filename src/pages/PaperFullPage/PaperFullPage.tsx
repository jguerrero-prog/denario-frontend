import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Sidebar } from '../../components/organisms/Sidebar/Sidebar';
import { LatexEditor } from '../../components/organisms/LatexEditor/LatexEditor';
import { useHydratedPipeline } from '../../hooks/useHydratedPipeline';
import { usePipelineStore } from '../../store/pipelineStore';
import { usePdfAvailability } from '../../hooks/usePdfAvailability';
import { api } from '../../api/client';
import type { PaperResultData } from '../../types/pipeline';
import styles from './PaperFullPage.module.css';

// This page used to show a fully fabricated fake-journal PDF preview (invented
// author/affiliation, a bar chart with made-up data, a results table with
// invented numbers) plus a LaTeX editor seeded with unrelated mock content —
// neither was ever wired to the real backend. It now renders the real
// manuscript.tex content always, and — when a LaTeX toolchain was actually
// available at generation time (see docker/Dockerfile.api) — a real compiled
// PDF too, embedded via the browser's own native PDF viewer rather than any
// custom renderer. On a machine with no LaTeX toolchain, manuscript.pdf
// simply doesn't exist and this section quietly doesn't render — same
// honest degradation as the rest of this page.

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

// ── Component ─────────────────────────────────────────────────────────────────

export function PaperFullPage() {
  const navigate = useNavigate();
  const { projectId, stageId = 'paper' } = useParams<{ projectId: string; stageId: string }>();
  const { pipeline, needsFetch, fetchFailed } = useHydratedPipeline(projectId);
  const result = pipeline?.stages['paper']?.result;
  const data = result?.stageData as PaperResultData | undefined;
  const backendProjectId = usePipelineStore(s => s.backendProjectId);

  // Wireframe pass (ticket 3.2) — texContent seeds once from the real
  // manuscript, then the editor owns it; cacheBust starts from the stage
  // result's own generatedAt and gets replaced by a fresh recompile's
  // compiled_at on Save, so usePdfAvailability actually re-checks.
  const [texContent, setTexContent] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [compileErrors, setCompileErrors] = useState<string | null>(null);
  const [cacheBust, setCacheBust] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (result?.rawContent && texContent === null) setTexContent(result.rawContent);
  }, [result?.rawContent, texContent]);

  const effectiveCacheBust = cacheBust ?? result?.generatedAt;
  const pdfAvailable = usePdfAvailability(backendProjectId, 'manuscript.pdf', effectiveCacheBust);

  const file = result?.file ?? 'manuscript.tex';

  async function handleSave() {
    if (!backendProjectId || texContent === null) return;
    setSaving(true);
    try {
      const res = await api.recompilePaper(backendProjectId, texContent);
      setCompileErrors(res.errors);
      setCacheBust(res.compiled_at);
    } finally {
      setSaving(false);
    }
  }

  function handleBack() {
    navigate(`/project/${projectId}/stage/${stageId}`);
  }

  function handleCopy() {
    navigator.clipboard.writeText(result?.rawContent ?? result?.content ?? '').catch(() => {});
  }

  if (fetchFailed) {
    return <div className={styles.layout} />;
  }

  if (needsFetch) {
    return <div className={styles.layout} />;
  }

  return (
    <div className={styles.layout}>
      <Sidebar />

      <main className={styles.main}>
        <div className={styles.topBar}>
          <button className={styles.backLink} onClick={handleBack}>
            <ChevronLeftIcon />
            Back to conversation
          </button>
        </div>

        <div className={styles.scrollArea}>
          <div className={styles.document}>

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
              <h1 className={styles.docTitle}>{result?.title ?? 'Manuscript'}</h1>
              <div className={styles.divider} />
            </div>

            {data?.abstract && (
              <div className={styles.section}>
                <p className={styles.sectionLabel}>Abstract</p>
                <p className={styles.prose}>{data.abstract}</p>
              </div>
            )}

            <div className={styles.section}>
              <div className={styles.pdfSectionHeader}>
                <p className={styles.sectionLabel}>{file}</p>
                <button className={styles.saveBtn} onClick={handleSave} disabled={saving || texContent === null}>
                  {saving ? 'Saving…' : 'Save'}
                </button>
              </div>

              {compileErrors && (
                <pre className={styles.compileErrors}>{compileErrors}</pre>
              )}

              {texContent !== null ? (
                <div className={styles.editorSplit}>
                  <div className={styles.editorPane}>
                    <LatexEditor value={texContent} onChange={setTexContent} />
                  </div>
                  <div className={styles.pdfPane}>
                    {pdfAvailable && backendProjectId ? (
                      <iframe
                        src={api.fileUrl(backendProjectId, 'manuscript.pdf', effectiveCacheBust)}
                        title="Compiled manuscript PDF"
                        className={styles.pdfEmbed}
                      />
                    ) : (
                      <p className={styles.prose}>No compiled PDF available.</p>
                    )}
                  </div>
                </div>
              ) : (
                <p className={styles.prose}>Manuscript not generated yet.</p>
              )}
            </div>

            <div className={styles.endFooter}>
              <div className={styles.divider} />
              <p className={styles.endLabel}>End of {file}</p>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
