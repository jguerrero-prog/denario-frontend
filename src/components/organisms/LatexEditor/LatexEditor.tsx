import { useEffect, useRef } from 'react';
import { EditorView, basicSetup } from 'codemirror';
import { EditorState } from '@codemirror/state';
import { latex } from 'codemirror-lang-latex';
import styles from './LatexEditor.module.css';

// Wireframe pass (ticket 3.2) — CodeMirror's own default theme, no lint-gutter
// wiring of compile errors yet, no custom autocomplete/tooltip config beyond
// whatever latex() bundles by default. Purpose is to see real proportions/
// behavior on the actual Paper page before designing the real thing.
export function LatexEditor({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (!containerRef.current) return;
    const state = EditorState.create({
      doc: value,
      extensions: [
        basicSetup,
        latex(),
        EditorView.updateListener.of(update => {
          if (update.docChanged) onChangeRef.current(update.state.doc.toString());
        }),
      ],
    });
    const view = new EditorView({ state, parent: containerRef.current });
    return () => view.destroy();
    // Mount once — deliberately not syncing external `value` changes into an
    // already-mounted editor (that fights cursor position). The caller only
    // renders this once real content has actually loaded, so there's nothing
    // to sync post-mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={containerRef} className={styles.editor} />;
}
