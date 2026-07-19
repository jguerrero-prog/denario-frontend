import { useNavigate, useParams } from 'react-router-dom';
import { Sidebar } from '../../components/organisms/Sidebar/Sidebar';
import { useHydratedPipeline } from '../../hooks/useHydratedPipeline';
import { InlineMarkdown } from '../../utils/MarkdownBlock';
import type { RefereeResultData, RefereeSection } from '../../types/pipeline';
import styles from './RefereeFullPage.module.css';

// ── Structured rendering ─────────────────────────────────────────────────────
// Renders DenarioBackend's denario/referee_parser.py output (referee.json).
// Every field beyond a section's `title` is optional by design (see
// structured_referee.py's own docstring) — a section with no points just
// renders its body paragraph, and vice versa.

function SectionBlock({ section }: { section: RefereeSection }) {
  return (
    <div className={styles.section}>
      <p className={styles.sectionLabel}>{section.title}</p>
      {section.body && (
        <p className={styles.prose}><InlineMarkdown text={section.body} /></p>
      )}
      {section.points.length > 0 && (
        <div className={styles.pointStack}>
          {section.points.map((point, i) => (
            <div key={i} className={styles.pointEntry}>
              {point.heading && <p className={styles.pointHeading}>{point.heading}</p>}
              <p className={styles.pointBody}><InlineMarkdown text={point.body} /></p>
            </div>
          ))}
        </div>
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

export function RefereeFullPage() {
  const navigate = useNavigate();
  const { projectId, stageId = 'referee' } = useParams<{ projectId: string; stageId: string }>();
  const { pipeline, needsFetch, fetchFailed } = useHydratedPipeline(projectId);
  const result = pipeline?.stages['referee']?.result;
  const data = result?.stageData as RefereeResultData | undefined;
  const structured = data?.structured;

  const file = result?.file ?? 'referee.md';

  // The "Score" section's body already duplicates score/score_note verbatim
  // (see referee_parser.py) — shown once as the chip below, not again in the
  // section list.
  const sections = structured?.sections.filter(s => !/^score$/i.test(s.title.trim())) ?? [];

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
      <Sidebar userEmail="researcher@lab.edu" />

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
              <h1 className={styles.docTitle}>{result?.title ?? 'Referee Report'}</h1>
              {structured?.score && (
                <span className={styles.scoreChip}>
                  Score: {structured.score}
                </span>
              )}
              <div className={styles.divider} />
            </div>

            {structured ? (
              <>
                {sections.map((section, i) => (
                  <SectionBlock key={i} section={section} />
                ))}
                {structured.score_note && (
                  <div className={styles.section}>
                    <p className={styles.sectionLabel}>Verdict</p>
                    <p className={styles.prose}><InlineMarkdown text={structured.score_note} /></p>
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
                <p className={styles.prose}>Referee report not generated yet.</p>
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
