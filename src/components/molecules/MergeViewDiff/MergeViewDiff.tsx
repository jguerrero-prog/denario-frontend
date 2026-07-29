import { useEffect, useRef } from 'react';
import { EditorView } from 'codemirror';
import { MergeView } from '@codemirror/merge';

// Read-only side-by-side diff via @codemirror/merge's MergeView — the
// consistent choice across every propose-then-confirm diff in the app
// (Methods edit preview, ticket 6.5; Paper chat-driven edits, ticket 3.4).
// Extracted out of ConversationThread.tsx once a second consumer
// (PaperPage.tsx) needed the identical mount/destroy logic, rather than
// duplicating the CodeMirror setup a second time.
export function MergeViewDiff({ oldContent, newContent, className }: { oldContent: string; newContent: string; className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const readOnlyWrap = [EditorView.editable.of(false), EditorView.lineWrapping];
    const view = new MergeView({
      a: { doc: oldContent, extensions: readOnlyWrap },
      b: { doc: newContent, extensions: readOnlyWrap },
      parent: containerRef.current,
    });
    return () => view.destroy();
    // Mount once per proposal — a new instance means a fresh diff, never
    // re-synced into an already-mounted view.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={containerRef} className={className} />;
}
