import { useNavigate, useParams } from 'react-router-dom';
import { Sidebar } from '../../components/organisms/Sidebar/Sidebar';
import { useHydratedPipeline } from '../../hooks/useHydratedPipeline';
import { InlineMarkdown, MarkdownBlock } from '../../utils/MarkdownBlock';
import { PublicationCard } from '../../components/molecules/PublicationCard/PublicationCard';
import type { LiteratureResultData, LiteraturePaper } from '../../types/pipeline';
import styles from './LiteratureFullPage.module.css';

// ── Structured rendering ─────────────────────────────────────────────────────
// Renders DenarioBackend's denario/literature_parser.py output (literature.json).
// Every field beyond `assessment` is optional by design (see
// structured_literature.py's own docstring) — a review missing a decision, a
// papers list, or a conclusion just renders without that piece.

function PaperEntry({ paper }: { paper: LiteraturePaper }) {
  return (
    <div className={styles.paperEntry}>
      <p className={styles.paperTitle}>
        {paper.url ? (
          <a href={paper.url} target="_blank" rel="noreferrer" className={styles.paperLink}>{paper.title}</a>
        ) : (
          paper.title
        )}
      </p>
      {paper.similarities && (
        <p className={styles.paperField}><span className={styles.paperFieldLabel}>Similarities</span><InlineMarkdown text={paper.similarities} /></p>
      )}
      {paper.differences && (
        <p className={styles.paperField}><span className={styles.paperFieldLabel}>Differences</span><InlineMarkdown text={paper.differences} /></p>
      )}
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

// ── Component ─────────────────────────────────────────────────────────────────

export function LiteratureFullPage() {
  const navigate = useNavigate();
  const { projectId, stageId = 'literature' } = useParams<{ projectId: string; stageId: string }>();
  const { pipeline, needsFetch, fetchFailed } = useHydratedPipeline(projectId);
  const result = pipeline?.stages['literature']?.result;
  const data = result?.stageData as LiteratureResultData | undefined;
  const structured = data?.structured;

  const file = result?.file ?? 'literature.md';

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
                </div>
              </div>
              <h1 className={styles.docTitle}>{result?.title ?? 'Literature Review'}</h1>
              {structured?.decision && (
                <span className={styles.decisionChip}>{structured.decision}</span>
              )}
              <div className={styles.divider} />
            </div>

            {structured ? (
              <>
                {structured.assessment && (
                  <div className={styles.section}>
                    <p className={styles.sectionLabel}>Novelty Assessment</p>
                    <MarkdownBlock className={styles.prose} text={structured.assessment} />
                  </div>
                )}

                {structured.papers.length > 0 && (
                  <div className={styles.section}>
                    <p className={styles.sectionLabel}>Most Relevant Papers</p>
                    {structured.papers.map((paper, i) => (
                      <PaperEntry key={i} paper={paper} />
                    ))}
                  </div>
                )}

                {/* The full deduplicated search corpus — raw metadata for
                    every paper the search actually found across every query
                    round, not just the ones discussed above. Distinct from
                    "Most Relevant Papers": no fabricated similarities/
                    differences for papers the LLM never compared. */}
                {data && data.searchedPapers.length > 0 && (
                  <div className={styles.section}>
                    <p className={styles.sectionLabel}>All Searched Papers ({data.searchedPapers.length})</p>
                    <div className={styles.publicationList}>
                      {data.searchedPapers.map((paper, i) => (
                        <PublicationCard key={paper.url ?? i} paper={paper} />
                      ))}
                    </div>
                  </div>
                )}

                {structured.conclusion && (
                  <div className={styles.section}>
                    <p className={styles.sectionLabel}>Conclusion</p>
                    <MarkdownBlock className={styles.prose} text={structured.conclusion} />
                  </div>
                )}
              </>
            ) : result?.rawContent ? (
              <div className={styles.section}>
                <p className={styles.sectionLabel}>{file}</p>
                <pre className={styles.fullDocument}>{result.rawContent}</pre>
              </div>
            ) : (
              <div className={styles.section}>
                <p className={styles.prose}>Literature review not generated yet.</p>
              </div>
            )}

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
