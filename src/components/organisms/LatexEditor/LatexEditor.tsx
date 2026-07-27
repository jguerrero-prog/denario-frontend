import { useEffect, useRef } from 'react';
import { EditorView, basicSetup } from 'codemirror';
import { EditorState } from '@codemirror/state';
import { latex } from 'codemirror-lang-latex';
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { tags } from '@lezer/highlight';
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

// Colors below mirror existing Denario tokens (--color-brand, --color-text-sec,
// --color-text-pri, --color-text-decorative) rather than new hex values —
// confirmed via Figma's variable defs that the design's syntax-highlight
// palette already matches those tokens exactly. CodeMirror themes take a
// static extension (no live CSS var resolution), so the token values are
// duplicated here as literals; keep in sync with tokens.css if those change.
const denarioHighlight = HighlightStyle.define([
  { tag: tags.keyword, color: '#2D6A2D' },
  { tag: tags.heading, color: '#2D6A2D' },
  { tag: tags.comment, color: '#A89F96', fontStyle: 'italic' },
  { tag: tags.bracket, color: '#6A6661' },
  { tag: tags.content, color: '#1C1C18' },
]);

const denarioEditorTheme = EditorView.theme({
  '&': {
    fontSize: '12px',
    height: '100%',
    backgroundColor: '#FFFFFF',
  },
  '.cm-content': {
    fontFamily: "'JetBrains Mono', ui-monospace, monospace",
    caretColor: '#1C1C18',
  },
  '.cm-gutters': {
    backgroundColor: '#FFFFFF',
    color: '#1C1C18',
    border: 'none',
  },
  '.cm-lineNumbers .cm-gutterElement': {
    fontFamily: "'JetBrains Mono', ui-monospace, monospace",
    fontSize: '11px',
  },
  '.cm-line': {
    lineHeight: '20px',
  },
});

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
        syntaxHighlighting(denarioHighlight),
        denarioEditorTheme,
        EditorView.lineWrapping,
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
