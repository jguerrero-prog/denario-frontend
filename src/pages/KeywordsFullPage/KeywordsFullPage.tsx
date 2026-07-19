import { useNavigate, useParams } from 'react-router-dom';
import { Sidebar } from '../../components/organisms/Sidebar/Sidebar';
import { useHydratedPipeline } from '../../hooks/useHydratedPipeline';
import type { KeywordsResultData } from '../../types/pipeline';
import styles from './KeywordsFullPage.module.css';

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

export function KeywordsFullPage() {
  const navigate = useNavigate();
  const { projectId, stageId = 'keywords' } = useParams<{ projectId: string; stageId: string }>();
  const { pipeline, needsFetch, fetchFailed } = useHydratedPipeline(projectId);
  const result = pipeline?.stages['keywords']?.result;
  const data = result?.stageData as KeywordsResultData | undefined;
  const keywords = data?.structured?.keywords ?? [];

  const file = result?.file ?? 'keywords.md';

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
              <h1 className={styles.docTitle}>{result?.title ?? 'Keywords'}</h1>
              <div className={styles.divider} />
            </div>

            {keywords.length > 0 ? (
              <div className={styles.section}>
                <p className={styles.sectionLabel}>{file}</p>
                <div className={styles.kwChips}>
                  {keywords.map(({ term, url }) => (
                    <div key={term} className={styles.kwChip}>
                      {url ? (
                        <a href={url} target="_blank" rel="noreferrer" className={styles.kwChipText}>{term}</a>
                      ) : (
                        <span className={styles.kwChipText}>{term}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : result?.rawContent ? (
              <div className={styles.section}>
                <p className={styles.sectionLabel}>{file}</p>
                <pre className={styles.fullDocument}>{result.rawContent}</pre>
              </div>
            ) : (
              <div className={styles.section}>
                <p className={styles.prose}>Keywords not generated yet.</p>
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
