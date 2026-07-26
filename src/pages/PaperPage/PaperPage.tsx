import { useEffect, useState } from 'react';
import { Sidebar } from '../../components/organisms/Sidebar/Sidebar';
import { LatexEditor, type LatexEditorDiagnostic } from '../../components/organisms/LatexEditor/LatexEditor';
import { usePipelineStore } from '../../store/pipelineStore';
import { usePdfAvailability } from '../../hooks/usePdfAvailability';
import { api } from '../../api/client';
import styles from './PaperPage.module.css';

// Wireframe pass (ticket 3.2, relocated here per ticket 3.5) — the standalone
// Paper workspace. This route carries no :projectId (see ROADMAP.md 3.5's
// still-open cross-project-vs-per-project question), so it reads whichever
// project is currently loaded in the store rather than hydrating one itself;
// if none is open, shows an honest empty state instead of an editor with
// nothing to edit. Deliberately minimal, same as the split-pane's first pass:
// CodeMirror's own default theme, fixed non-resizable split, plain-text
// compile errors, no lint-gutter wiring.
export function PaperPage() {
  const pipeline = usePipelineStore(s => s.pipeline);
  const backendProjectId = usePipelineStore(s => s.backendProjectId);
  const result = pipeline?.stages['paper']?.result;

  const [texContent, setTexContent] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [compileErrors, setCompileErrors] = useState<string | null>(null);
  const [diagnostics, setDiagnostics] = useState<LatexEditorDiagnostic[]>([]);
  const [cacheBust, setCacheBust] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (result?.rawContent && texContent === null) setTexContent(result.rawContent);
  }, [result?.rawContent, texContent]);

  const effectiveCacheBust = cacheBust ?? result?.generatedAt;
  const pdfAvailable = usePdfAvailability(backendProjectId, 'manuscript.pdf', effectiveCacheBust);

  async function handleSave() {
    if (!backendProjectId || texContent === null) return;
    setSaving(true);
    try {
      const res = await api.recompilePaper(backendProjectId, texContent);
      setCompileErrors(res.errors);
      setDiagnostics(res.diagnostics);
      setCacheBust(res.compiled_at);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={styles.layout}>
      <Sidebar />
      <main className={styles.main}>
        {!pipeline || !backendProjectId ? (
          <div className={styles.empty}>
            <p className={styles.title}>Paper</p>
            <p className={styles.subtitle}>No project open — open a project to edit its manuscript.</p>
          </div>
        ) : texContent === null ? (
          <div className={styles.empty}>
            <p className={styles.title}>Paper</p>
            <p className={styles.subtitle}>Manuscript not generated yet.</p>
          </div>
        ) : (
          <div className={styles.editorArea}>
            <div className={styles.header}>
              <p className={styles.title}>{result?.title ?? 'Manuscript'}</p>
              <button className={styles.saveBtn} onClick={handleSave} disabled={saving}>
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>

            {compileErrors && (
              <pre className={styles.compileErrors}>{compileErrors}</pre>
            )}

            <div className={styles.editorSplit}>
              <div className={styles.editorPane}>
                <LatexEditor value={texContent} onChange={setTexContent} diagnostics={diagnostics} />
              </div>
              <div className={styles.pdfPane}>
                {pdfAvailable && backendProjectId ? (
                  <iframe
                    src={api.fileUrl(backendProjectId, 'manuscript.pdf', effectiveCacheBust)}
                    title="Compiled manuscript PDF"
                    className={styles.pdfEmbed}
                  />
                ) : (
                  <p className={styles.subtitle}>No compiled PDF available.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
