import type { SearchedPaper } from '../../../types/pipeline';
import styles from './PublicationCard.module.css';

// One card per paper from the full searched literature corpus (see
// DenarioBackend's denario/papers_log_parser.py) — raw search metadata
// (authors/abstract), not the curated "Most Relevant Papers" novelty
// comparison shown elsewhere on the Literature stage. Used both as a
// 3-paper teaser in the conversation thread and for the full list on
// LiteratureFullPage.

function LinkIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" className={styles.linkIcon}>
      <path d="M5.5 8.5L8.5 5.5" />
      <path d="M6.5 3.5L7.5 2.5a2 2 0 0 1 2.83 2.83l-1 1" />
      <path d="M7.5 10.5l-1 1a2 2 0 0 1-2.83-2.83l1-1" />
    </svg>
  );
}

function ExternalLinkIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" className={styles.externalIcon}>
      <path d="M6.5 3H3v10h10V9.5" />
      <path d="M9.5 2.5H13.5V6.5" />
      <path d="M13.5 2.5L7 9" />
    </svg>
  );
}

export function PublicationCard({ paper }: { paper: SearchedPaper }) {
  return (
    <div className={styles.card}>
      <p className={styles.title}>{paper.title}</p>

      <div className={styles.field}>
        <p className={styles.fieldLabel}>Authors</p>
        <p className={styles.fieldValue}>
          {paper.authors}{paper.year ? ` (${paper.year})` : ''}
        </p>
      </div>

      <div className={styles.field}>
        <p className={styles.fieldLabel}>Abstract</p>
        <p className={`${styles.fieldValue} ${styles.abstractValue}`}>{paper.abstract}</p>
      </div>

      {paper.url && (
        <>
          <div className={styles.divider} />
          <div className={styles.footer}>
            <a href={paper.url} target="_blank" rel="noreferrer" className={styles.link}>
              <LinkIcon />
              View Publication (doi)
            </a>
            <ExternalLinkIcon />
          </div>
        </>
      )}
    </div>
  );
}
