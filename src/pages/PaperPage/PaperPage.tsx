import { useEffect, useState } from 'react';
import { Sidebar } from '../../components/organisms/Sidebar/Sidebar';
import { LatexEditor, type LatexEditorDiagnostic } from '../../components/organisms/LatexEditor/LatexEditor';
import { usePipelineStore } from '../../store/pipelineStore';
import { usePdfAvailability } from '../../hooks/usePdfAvailability';
import { api } from '../../api/client';
import styles from './PaperPage.module.css';

type RightPanelTab = 'pdf' | 'summary' | 'logs' | 'suggestions';

const RIGHT_PANEL_TABS: { key: RightPanelTab; label: string }[] = [
  { key: 'pdf', label: 'PDF' },
  { key: 'summary', label: 'Summary' },
  { key: 'logs', label: 'Logs' },
  { key: 'suggestions', label: 'Suggestions' },
];

function SendIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}

// Design: Figma node 797:2043 (folder-tab layout revision of the "Paper"
// split-pane, superseding node 783:1614's pill-style tabs). Two pieces of
// the design remain deliberately static/non-functional scaffolding, per the
// same product decision as before — not yet scoped:
//   - the "Paper: {title} / Thread" folder tabs above the editor
//   - the "Ask for a suggestion..." input bar below it
// Everything else (right panel's PDF/Summary/Logs/Suggestions tabs +
// Recompile button, editor theme) is real. Summary/Logs/Suggestions tabs
// are static placeholder text — only PDF is wired to real data.
export function PaperPage() {
  const pipeline = usePipelineStore(s => s.pipeline);
  const backendProjectId = usePipelineStore(s => s.backendProjectId);
  const result = pipeline?.stages['paper']?.result;

  const [texContent, setTexContent] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [compileErrors, setCompileErrors] = useState<string | null>(null);
  const [diagnostics, setDiagnostics] = useState<LatexEditorDiagnostic[]>([]);
  const [xelatexAvailable, setXelatexAvailable] = useState<boolean | null>(null);
  const [cacheBust, setCacheBust] = useState<number | undefined>(undefined);
  const [rightTab, setRightTab] = useState<RightPanelTab>('pdf');

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
      setXelatexAvailable(res.xelatex_available);
      setCacheBust(res.compiled_at);
    } finally {
      setSaving(false);
    }
  }

  if (!pipeline || !backendProjectId) {
    return (
      <div className={styles.layout}>
        <Sidebar />
        <main className={styles.main}>
          <div className={styles.empty}>
            <p className={styles.emptyTitle}>Paper</p>
            <p className={styles.subtitle}>No project open — open a project to edit its manuscript.</p>
          </div>
        </main>
      </div>
    );
  }

  if (texContent === null) {
    return (
      <div className={styles.layout}>
        <Sidebar />
        <main className={styles.main}>
          <div className={styles.empty}>
            <p className={styles.emptyTitle}>Paper</p>
            <p className={styles.subtitle}>Manuscript not generated yet.</p>
          </div>
        </main>
      </div>
    );
  }

  const title = result?.title ?? 'Manuscript';

  return (
    <div className={styles.layout}>
      <Sidebar />
      <main className={styles.main}>
        <div className={styles.editorColumn}>
          <div className={styles.tabStrip}>
            <div className={styles.tabActive} title={`Paper: ${title}`}>
              <span className={styles.tabDot} />
              <span className={styles.tabLabel}>Paper: {title}</span>
            </div>
            <div className={styles.tabInactive}>
              <span className={styles.tabLabelInactive}>Thread</span>
            </div>
            <div className={styles.tabFiller} />
          </div>

          <div className={styles.editorCard}>
            <div className={styles.editorPane}>
              <LatexEditor value={texContent} onChange={setTexContent} diagnostics={diagnostics} />
            </div>

            {/* Static scaffolding per design (node 797:2152) — not wired to anything yet. */}
            <form className={styles.aiBar} onSubmit={e => e.preventDefault()}>
              <input
                className={styles.aiBarInput}
                placeholder="Ask for a suggestion, edit or structural change…"
                disabled
              />
              <button type="submit" className={styles.aiBarSend} disabled aria-label="Send">
                <SendIcon />
              </button>
            </form>
          </div>
        </div>

        <div className={styles.rightPanel}>
          <div className={styles.rightPanelHeader}>
            <div className={styles.rightPanelTabs}>
              {RIGHT_PANEL_TABS.map(tab => (
                <button
                  key={tab.key}
                  type="button"
                  className={tab.key === rightTab ? styles.rightPanelTabActive : styles.rightPanelTab}
                  onClick={() => setRightTab(tab.key)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <button className={styles.recompileBtn} onClick={handleSave} disabled={saving}>
              {saving ? 'Recompiling…' : 'Recompile'}
            </button>
          </div>

          <div className={styles.rightPanelContent}>
            {rightTab === 'pdf' && (
              <>
                {xelatexAvailable === false && (
                  <p className={styles.xelatexWarning}>
                    PDF not regenerated — this backend has no LaTeX toolchain installed. Your edits were saved to the manuscript file, but the PDF below is unchanged.
                  </p>
                )}
                {compileErrors && (
                  <pre className={styles.compileErrors}>{compileErrors}</pre>
                )}
                {pdfAvailable && backendProjectId ? (
                  <iframe
                    src={`${api.fileUrl(backendProjectId, 'manuscript.pdf', effectiveCacheBust)}#toolbar=0&navpanes=0&scrollbar=0`}
                    title="Compiled manuscript PDF"
                    className={styles.pdfEmbed}
                  />
                ) : (
                  <p className={styles.subtitle}>No compiled PDF available.</p>
                )}
              </>
            )}
            {rightTab === 'summary' && (
              <p className={styles.placeholderText}>Summary isn't scoped out yet — coming soon.</p>
            )}
            {rightTab === 'logs' && (
              <p className={styles.placeholderText}>Logs aren't scoped out yet — coming soon.</p>
            )}
            {rightTab === 'suggestions' && (
              <p className={styles.placeholderText}>Suggestions aren't scoped out yet — coming soon.</p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
