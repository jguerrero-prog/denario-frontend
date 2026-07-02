import styles from './BrandMark.module.css';

const BANDS = [
  { color: '#16A34A', label: 'Bio/Environment',      hex: '#16A34A' },
  { color: '#EA580C', label: 'Chem/Physics',         hex: '#EA580C' },
  { color: '#2563EB', label: 'CompSci/Math',         hex: '#2563EB' },
  { color: '#7C3AED', label: 'Med/Interdisciplinary', hex: '#7C3AED' },
];

function DisciplineBands({ width, height }: { width: number; height: number }) {
  const bandH = height / 4;
  return (
    <div className={styles.bandsStack} style={{ width, height }}>
      {BANDS.map(b => (
        <div key={b.color} style={{ background: b.color, height: bandH, flexShrink: 0 }} />
      ))}
    </div>
  );
}

function ConvergenceMark({ width, height }: { width: number; height: number }) {
  const cx = width;
  const cy = height / 2;
  const bh = height / 4;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Convergence variant">
      <polygon points={`0,0 ${cx},${cy} 0,${bh}`}       fill={BANDS[0].color} />
      <polygon points={`0,${bh} ${cx},${cy} 0,${bh*2}`} fill={BANDS[1].color} />
      <polygon points={`0,${bh*2} ${cx},${cy} 0,${bh*3}`} fill={BANDS[2].color} />
      <polygon points={`0,${bh*3} ${cx},${cy} 0,${height}`} fill={BANDS[3].color} />
    </svg>
  );
}

function ColorBar({ width, height }: { width: number; height: number }) {
  return (
    <div className={styles.colorBar} style={{ width, height }}>
      {BANDS.map(b => (
        <div key={b.color} style={{ background: b.color, flex: '1 0 0', height: '100%' }} />
      ))}
    </div>
  );
}

export function BrandMark() {
  return (
    <div className={styles.page}>

      {/* Page Header */}
      <div className={styles.pageHeader}>
        <div className={styles.pageHeaderInner}>
          <p className={styles.pageTitle}>Denario · Brand Mark</p>
          <p className={styles.pageSubtitle}>Step 1 · Primary Mark + Convergence Variant + Wordmark Lockup</p>
        </div>
        <div className={styles.headerLine} role="separator" />
      </div>

      {/* Section 1: Primary Mark */}
      <div className={styles.section}>
        <div className={styles.sectionLabelRow}>
          <p className={styles.sectionLabel}>PRIMARY MARK — Discipline Bands</p>
        </div>
        <div className={styles.primaryMarkDemo}>
          <div className={styles.primaryMarkCenter}>
            <DisciplineBands width={640} height={160} />
            <div className={styles.dimensionAnnotations}>
              <div className={styles.widthAnnotation}>
                <div className={styles.annotationLine} />
                <p className={styles.annotationCode}>640px</p>
                <div className={styles.annotationLine} />
              </div>
              <div className={styles.heightAnnotations}>
                <div className={styles.heightLeft}>
                  <p className={styles.annotationCode}>40px</p>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#52525b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M12 2v20M5 15l7 7 7-7M5 9l7-7 7 7"/>
                  </svg>
                </div>
                <p className={styles.annotationNote}>Equal weight — 1:1:1:1 ratio</p>
                <p className={styles.annotationCode}>160px</p>
              </div>
            </div>
          </div>
        </div>
        <div className={styles.sectionNotes}>
          <p className={styles.noteText}>The primary mark is always rendered at a 4:1 width-to-height ratio. Each band carries equal visual weight. Color order is fixed: Bio → Chem → CompSci → Med, top to bottom.</p>
          <p className={styles.noteText}>Minimum width: 80px. Below 80px use the square 2×2 grid variant. Never stretch, reorder, or crop individual bands.</p>
        </div>
      </div>

      {/* Section 2: Convergence Variant */}
      <div className={styles.section}>
        <div className={styles.sectionLabelRow}>
          <p className={styles.sectionLabel}>CONVERGENCE VARIANT — Diagonal Synthesis</p>
        </div>
        <div className={styles.convergenceDemo}>
          <ConvergenceMark width={800} height={200} />
          <div className={styles.convergenceLockup}>
            <ConvergenceMark width={200} height={50} />
            <p className={styles.wordmarkText}>Denario</p>
          </div>
          <p className={styles.convergenceNote}>
            The Convergence variant communicates synthesis — separate disciplines meeting to produce unified scientific discovery. Used in onboarding, hero sections, and full-bleed contexts.
          </p>
        </div>
      </div>

      {/* Section 3: Wordmark Lockups */}
      <div className={styles.section}>
        <div className={styles.sectionLabelRow}>
          <p className={styles.sectionLabel}>WORDMARK LOCKUPS</p>
        </div>
        <div className={styles.lockupsGrid}>
          {/* Lockup A */}
          <div className={styles.lockupItem}>
            <div className={styles.lockupDisplay}>
              <p className={styles.lockupWordmarkLg}>Denario</p>
              <ColorBar width={180} height={6} />
              <p className={styles.lockupTagline}>Scientific Research AI</p>
            </div>
            <p className={styles.lockupDesc}>Lockup A · Primary lockup on dark background.</p>
          </div>
          {/* Lockup C */}
          <div className={styles.lockupItem}>
            <div className={styles.lockupDisplay}>
              <p className={`${styles.lockupWordmarkLg} ${styles.lockupWordmarkLight}`}>Denario</p>
              <ColorBar width={180} height={6} />
              <p className={`${styles.lockupTagline} ${styles.lockupTaglineLight}`}>Scientific Research AI</p>
            </div>
            <p className={`${styles.lockupDesc} ${styles.lockupDescLight}`}>Lockup C · Optimized for academic cream surfaces.</p>
          </div>
          {/* Lockup B */}
          <div className={styles.lockupItem}>
            <div className={styles.lockupDisplay}>
              <p className={styles.lockupWordmarkSm}>Denario</p>
              <ColorBar width={72} height={3} />
            </div>
            <p className={styles.lockupDesc}>Lockup B · Compact UI variant for sidebars and navigation.</p>
          </div>
          {/* Lockup D */}
          <div className={styles.lockupItem}>
            <div className={styles.lockupDisplayRow}>
              <p className={styles.lockupMonogram}>D</p>
              <ColorBar width={8} height={48} />
            </div>
            <p className={styles.lockupDesc}>Lockup D · Monogram for profile and mobile shortcuts.</p>
          </div>
        </div>
        <p className={styles.lockupFootnote}>
          The 6px color bar is the minimum brand accent in UI contexts. It reduces to 3px in compact navigation. Never use the bar in isolation without the wordmark.
        </p>
      </div>

      {/* Section 4: Scale Variants */}
      <div className={styles.section}>
        <div className={styles.sectionLabelRow}>
          <p className={styles.sectionLabel}>SCALE VARIANTS — Discipline Bands</p>
        </div>
        <div className={styles.scaleRow}>
          {[
            { label: 'Large',  w: 640, h: 160, code: '640×160px' },
            { label: 'Medium', w: 320, h: 80,  code: '320×80px' },
            { label: 'Small',  w: 160, h: 40,  code: '160×40px' },
            { label: 'Mini',   w: 80,  h: 20,  code: '80×20px' },
            { label: 'Icon',   w: 40,  h: 40,  code: '40×40px', square: true },
          ].map(({ label, w, h, code, square }) => (
            <div key={label} className={styles.scaleItem}>
              {square ? (
                <div className={styles.squareVariant}>
                  <div style={{ background: BANDS[0].color, width: 20, height: 20 }} />
                  <div style={{ background: BANDS[1].color, width: 20, height: 20 }} />
                  <div style={{ background: BANDS[2].color, width: 20, height: 20 }} />
                  <div style={{ background: BANDS[3].color, width: 20, height: 20 }} />
                </div>
              ) : (
                <DisciplineBands width={w} height={h} />
              )}
              <div className={styles.scaleLabel}>
                <p className={styles.scaleName}>{label}</p>
                <p className={styles.scaleCode}>{code}</p>
              </div>
            </div>
          ))}
        </div>
        <p className={styles.scaleNote}>
          Below 80px width, transition to the square 2×2 grid variant. The band proportions remain 1:1:1:1 at all sizes.
        </p>
      </div>

      {/* Footer: Color Palette */}
      <div className={styles.footer}>
        <div className={styles.footerLine} role="separator" />
        <div className={styles.footerInner}>
          <div className={styles.swatches}>
            {[
              ...BANDS,
              { color: '#2D6A2D', label: 'UI Primary', hex: '#2D6A2D' },
            ].map(b => (
              <div key={b.hex} className={styles.swatchItem}>
                <div className={styles.swatchColor} style={{ background: b.color }} />
                <div className={styles.swatchLabels}>
                  <p className={styles.swatchName}>{b.label}</p>
                  <p className={styles.swatchHex}>{b.hex}</p>
                </div>
              </div>
            ))}
          </div>
          <p className={styles.footerVersion}>Denario Brand Mark · v1.0 · Step 1 Refinement</p>
        </div>
      </div>
    </div>
  );
}
