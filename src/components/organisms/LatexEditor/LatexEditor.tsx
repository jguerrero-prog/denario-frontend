import { useEffect, useRef } from 'react';
import { EditorView, basicSetup } from 'codemirror';
import { EditorState } from '@codemirror/state';
import { latex } from 'codemirror-lang-latex';
import { lintGutter, setDiagnostics, type Diagnostic } from '@codemirror/lint';
import styles from './LatexEditor.module.css';

export interface LatexEditorDiagnostic {
  line: number | null;
  message: string;
}

interface LatexEditorProps {
  value: string;
  onChange: (v: string) => void;
  diagnostics?: LatexEditorDiagnostic[];
}

// Wireframe pass (ticket 3.2) — CodeMirror's own default theme, no custom
// autocomplete/tooltip config beyond whatever latex() bundles by default.
// Purpose is to see real proportions/behavior on the actual Paper page
// before designing the real thing.
//
// enableLinting is turned off deliberately: codemirror-lang-latex's own
// structural linter (missing \begin{document}, unmatched environments, etc.)
// shares CodeMirror's single lint state field with our own setDiagnostics()
// calls below. Verified empirically (Playwright) that leaving it on silently
// wipes out our real compile-error diagnostics within ~500ms, whether or not
// we also register our own linter() source — the package's periodic re-lint
// just overwrites whatever's there. Trading away the package's structural
// checks for now so our actual backend compile errors reliably stick.
export function LatexEditor({ value, onChange, diagnostics }: LatexEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const viewRef = useRef<EditorView | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const state = EditorState.create({
      doc: value,
      extensions: [
        basicSetup,
        latex({ enableLinting: false }),
        lintGutter(),
        EditorView.updateListener.of(update => {
          if (update.docChanged) onChangeRef.current(update.state.doc.toString());
        }),
      ],
    });
    const view = new EditorView({ state, parent: containerRef.current });
    viewRef.current = view;
    return () => {
      viewRef.current = null;
      view.destroy();
    };
    // Mount once — deliberately not syncing external `value` changes into an
    // already-mounted editor (that fights cursor position). The caller only
    // renders this once real content has actually loaded, so there's nothing
    // to sync post-mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const docLines = view.state.doc.lines;
    const cmDiagnostics: Diagnostic[] = (diagnostics ?? []).map(d => {
      const lineNum = d.line !== null && d.line >= 1 && d.line <= docLines ? d.line : 1;
      const line = view.state.doc.line(lineNum);
      return { from: line.from, to: line.to, severity: 'error', message: d.message };
    });
    view.dispatch(setDiagnostics(view.state, cmDiagnostics));
  }, [diagnostics]);

  return <div ref={containerRef} className={styles.editor} />;
}
