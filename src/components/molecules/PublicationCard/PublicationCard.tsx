import type { SearchedPaper } from '../../../types/pipeline';
import styles from './PublicationCard.module.css';

// One card per paper from the full searched literature corpus (see
// DenarioBackend's denario/papers_log_parser.py) — raw search metadata
// (authors/abstract), not the curated "Most Relevant Papers" novelty
// comparison shown elsewhere on the Literature stage. Used both as a
// 3-paper teaser in the conversation thread and for the full list on
// LiteratureFullPage.

// Two interlocking chain-link capsules — the standard "link" glyph shape
// (same design used across most icon sets, e.g. Feather/Lucide's "link").
// Native 24x24 viewBox scaled down to the card's 14px slot.
function LinkIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.linkIcon}>
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
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
