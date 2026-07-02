import styles from './ContrastTable.module.css';

interface ContrastRow {
  token: string;
  hex: string;
  isDecorativeOnly?: boolean;
  ratios: {
    bgApp: string;
    bgSidebar: string;
    bgCard: string;
    bgActive: string;
  };
  passes: {
    bgApp: boolean;
    bgSidebar: boolean;
    bgCard: boolean;
    bgActive: boolean;
  };
  threshold: string;
}

const rows: ContrastRow[] = [
  {
    token: 'text-primary',
    hex: '#1C1C18',
    ratios: { bgApp: '15.07:1', bgSidebar: '13.86:1', bgCard: '17.09:1', bgActive: '13.78:1' },
    passes: { bgApp: true, bgSidebar: true, bgCard: true, bgActive: true },
    threshold: '4.5:1 Normal',
  },
  {
    token: 'text-secondary',
    hex: '#6A6661',
    ratios: { bgApp: '5.02:1', bgSidebar: '4.62:1', bgCard: '5.70:1', bgActive: '4.59:1' },
    passes: { bgApp: true, bgSidebar: true, bgCard: true, bgActive: true },
    threshold: '4.5:1 Normal',
  },
  {
    token: 'text-muted',
    hex: '#8B837C',
    ratios: { bgApp: '3.28:1', bgSidebar: '3.02:1', bgCard: '3.73:1', bgActive: '3.00:1' },
    passes: { bgApp: true, bgSidebar: true, bgCard: true, bgActive: true },
    threshold: '3.0:1 Large Text',
  },
  {
    token: 'text-decorative',
    hex: '#A89F96',
    isDecorativeOnly: true,
    ratios: { bgApp: '2.30:1', bgSidebar: '2.11:1', bgCard: '2.60:1', bgActive: '2.10:1' },
    passes: { bgApp: false, bgSidebar: false, bgCard: false, bgActive: false },
    threshold: 'Decorative only',
  },
];

const usageGuidelines = [
  { token: 'text-primary',     description: 'All body text, headings, labels, interactive elements — any text conveying information' },
  { token: 'text-secondary',   description: 'Supporting prose, section body, step descriptions, metadata that must be readable' },
  { token: 'text-muted',       description: 'Large-text-only use: section labels (≥14px bold), timestamps at 18px+, supporting captions' },
  { token: 'text-decorative',  description: 'Decorative only: divider labels, page footers, watermarks — never for informational text' },
];

export function ContrastTable() {
  return (
    <div className={styles.wrapper}>
      <p className={styles.description}>
        All text tokens are validated against WCAG 2.1 AA standards across the full background
        palette. text-secondary and text-muted values were corrected from the initial design. A 4th
        token, text-decorative, preserves the original muted aesthetic but is restricted to
        non-informational, purely decorative text.
      </p>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr className={styles.headerRow}>
              <th className={styles.th}>Token</th>
              <th className={styles.th}>Hex</th>
              <th className={styles.th}>bg-app</th>
              <th className={styles.th}>bg-sidebar</th>
              <th className={styles.th}>bg-card</th>
              <th className={styles.th}>bg-active</th>
              <th className={styles.th}>AA Threshold</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={row.token} className={i % 2 === 0 ? styles.rowEven : styles.rowOdd}>
                <td className={styles.td}>
                  <div className={styles.tokenCell}>
                    {row.isDecorativeOnly && <span className={styles.dot} aria-hidden="true" />}
                    <code className={styles.tokenName}>{row.token}</code>
                  </div>
                </td>
                <td className={styles.td}>
                  <code className={styles.tokenName}>{row.hex}</code>
                </td>
                {(['bgApp', 'bgSidebar', 'bgCard', 'bgActive'] as const).map((bg) => (
                  <td key={bg} className={styles.td}>
                    <span className={row.passes[bg] ? styles.pass : styles.fail}>
                      {row.ratios[bg]} {row.passes[bg] ? '✓' : '✗'}
                    </span>
                  </td>
                ))}
                <td className={styles.td}>
                  <span className={row.isDecorativeOnly ? styles.decorativeLabel : styles.thresholdLabel}>
                    {row.threshold}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={7} className={styles.footnote}>
                ✓ Passes · ✗ Fails · Large Text threshold (3:1) applies to text ≥ 18pt or ≥ 14pt
                bold · text-decorative is exempt per WCAG 1.4.3 (decorative text)
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className={styles.guidelines}>
        <p className={styles.guidelinesTitle}>Usage Guidelines</p>
        {usageGuidelines.map(({ token, description }) => (
          <div key={token} className={styles.guidelineRow}>
            <code className={styles.guidelineToken}>{token}</code>
            <p className={styles.guidelineDescription}>{description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
