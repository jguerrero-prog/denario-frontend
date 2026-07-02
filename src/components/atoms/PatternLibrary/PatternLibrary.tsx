import styles from './PatternLibrary.module.css';

/* ── Inline SVG icons ── */
const ChevronRight = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
    <path d="M4.5 2.5L7.5 6L4.5 9.5" stroke="#6A6661" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const ChevronDown = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
    <path d="M2.5 4.5L6 7.5L9.5 4.5" stroke="#6A6661" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const DownloadIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M8 3v7M5 7l3 3 3-3M3 12h10" stroke="#6A6661" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const CopyIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <rect x="5" y="5" width="8" height="8" rx="1.5" stroke="#6A6661" strokeWidth="1.25" />
    <path d="M11 5V3.5A1.5 1.5 0 0 0 9.5 2h-6A1.5 1.5 0 0 0 2 3.5v6A1.5 1.5 0 0 0 3.5 11H5" stroke="#6A6661" strokeWidth="1.25" strokeLinecap="round" />
  </svg>
);
const CloseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M4 4l8 8M12 4l-8 8" stroke="#6A6661" strokeWidth="1.25" strokeLinecap="round" />
  </svg>
);
const LockIcon = () => (
  <svg width="10" height="12" viewBox="0 0 10 12" fill="none">
    <path d="M2 5V3.5a3 3 0 0 1 6 0V5" stroke="#A89F96" strokeWidth="1.25" strokeLinecap="round" />
    <rect x="1" y="5" width="8" height="6" rx="1.5" fill="#A89F96" />
  </svg>
);

/* ── Shared row layout ── */
interface RowProps {
  id: string;
  name: string;
  notes: string;
  children: React.ReactNode;
}
function PatternRow({ id, name, notes, children }: RowProps) {
  return (
    <div className={styles.row}>
      <div className={styles.specimenCol}>
        <div className={styles.labelGroup}>
          <span className={styles.rowId}>{id}</span>
          <span className={styles.rowName}>{name}</span>
        </div>
        <div className={styles.specimenContent}>{children}</div>
      </div>
      <div className={styles.noteCol}>
        <span className={styles.noteHead}>Usage &amp; Measurements</span>
        <p className={styles.noteBody}>{notes}</p>
      </div>
    </div>
  );
}

/* ── Group header ── */
function GroupHeader({ label }: { label: string }) {
  return (
    <div className={styles.groupHeader}>
      <div className={styles.groupAccent} />
      <span className={styles.groupLabel}>{label}</span>
    </div>
  );
}

/* ══════════════════════════════════════════
   GROUP 01 — INDICATORS & BADGES
══════════════════════════════════════════ */

function A1StatusDot() {
  return (
    <div className={styles.dotRow}>
      {[
        { label: 'Complete', dot: <span className={`${styles.dot} ${styles.dotComplete}`} /> },
        { label: 'Active',   dot: <span className={`${styles.dot} ${styles.dotActive}`} /> },
        { label: 'Locked',   dot: <LockIcon /> },
        { label: 'Muted',    dot: <span className={`${styles.dot} ${styles.dotMuted}`} /> },
      ].map(({ label, dot }) => (
        <div key={label} className={styles.dotItem}>
          {dot}
          <span className={styles.dotLabel}>{label}</span>
        </div>
      ))}
    </div>
  );
}

function A2ActiveStagePill() {
  return (
    <div className={styles.activePill}>
      <span className={styles.activePillText}>Active</span>
    </div>
  );
}

function A3ModeTogglePill() {
  return (
    <div className={styles.modeToggle}>
      <div className={styles.modeActive}>Pipeline</div>
      <span className={styles.modeInactive}>Modular</span>
    </div>
  );
}

function A4ProgressBar() {
  return (
    <div className={styles.progressGroup}>
      <div className={styles.progressItem}>
        <div className={styles.progressTrack}>
          <div className={styles.progressFill} style={{ width: '50%' }} />
        </div>
        <span className={styles.progressLabel}>50% complete</span>
      </div>
      <div className={styles.progressItem}>
        <div className={`${styles.progressTrack} ${styles.progressTrackFull}`} />
        <span className={styles.progressLabel}>100% complete</span>
      </div>
    </div>
  );
}

function A5ModifiedBadge() {
  return (
    <div className={styles.modifiedBadge}>
      <span className={styles.modifiedDot} />
      <span className={styles.modifiedText}>Modified</span>
    </div>
  );
}

function A6FileChip() {
  return (
    <div className={styles.chipRow}>
      <div className={styles.fileChip}>
        <span className={styles.chipDot} />
        <span className={styles.chipMono}>method.md</span>
      </div>
      <div className={`${styles.fileChip} ${styles.fileChipSelected}`}>
        <span className={`${styles.chipDot} ${styles.chipDotLarge}`} />
        <span className={`${styles.chipMono} ${styles.chipMonoBold}`}>method.md</span>
      </div>
    </div>
  );
}

function A7StatChip() {
  return (
    <div className={styles.chipRow}>
      {['R² 0.718', 'p < 0.001', '2 self-heals'].map((label) => (
        <div key={label} className={styles.statChip}>
          <span className={styles.statChipText}>{label}</span>
        </div>
      ))}
    </div>
  );
}

function A8ToggleSwitch() {
  return (
    <div className={styles.toggleRow}>
      <div className={styles.toggleItem}>
        <div className={`${styles.toggle} ${styles.toggleOn}`}>
          <div className={styles.toggleThumb} />
        </div>
        <span className={styles.toggleLabel}>ON</span>
      </div>
      <div className={styles.toggleItem}>
        <div className={`${styles.toggle} ${styles.toggleOff}`}>
          <div className={styles.toggleThumb} />
        </div>
        <span className={styles.toggleLabel}>OFF</span>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   GROUP 02 — ROWS & CONTAINERS
══════════════════════════════════════════ */

function B1StageRow() {
  return (
    <div className={styles.stageRows}>
      {/* Complete */}
      <div className={styles.stageRow}>
        <div className={styles.stageCheckbox} />
        <span className={styles.stageText}>Input Prompt</span>
        <span className={`${styles.dot} ${styles.dotComplete}`} style={{ width: 8, height: 8 }} />
      </div>
      {/* Active */}
      <div className={`${styles.stageRow} ${styles.stageRowActive}`}>
        <div className={styles.stageAccentBar} />
        <div className={styles.stageCheckbox} />
        <span className={styles.stageText}>Analysis</span>
        <div className={styles.activeLabel}>ACTIVE</div>
      </div>
      {/* Locked */}
      <div className={`${styles.stageRow} ${styles.stageRowLocked}`}>
        <div className={`${styles.stageCheckbox} ${styles.stageCheckboxLocked}`} />
        <span className={`${styles.stageText} ${styles.stageTextLocked}`}>Paper</span>
        <LockIcon />
      </div>
    </div>
  );
}

function B2AccordionRowHeader() {
  return (
    <div className={styles.accordionRows}>
      {/* Collapsed */}
      <div className={styles.accordionRow}>
        <div className={styles.accordionLeft}>
          <span className={styles.accordionLabel}>Analysis</span>
          <span className={`${styles.dot} ${styles.dotComplete}`} style={{ width: 8, height: 8 }} />
        </div>
        <ChevronRight />
      </div>
      {/* Expanded */}
      <div className={`${styles.accordionRow} ${styles.accordionRowExpanded}`}>
        <div className={styles.accordionAccentBar} />
        <div className={styles.accordionLeft}>
          <span className={styles.accordionLabel}>Analysis</span>
          <span className={`${styles.dot} ${styles.dotComplete}`} style={{ width: 8, height: 8 }} />
        </div>
        <ChevronDown />
      </div>
    </div>
  );
}

function B3AccordionExpanded() {
  return (
    <div className={styles.expandedBlock}>
      <div className={styles.fileChip}>
        <span className={styles.chipDot} />
        <span className={styles.chipMono}>method.md</span>
      </div>
      <div className={styles.chipRow}>
        {['R² 0.718', 'p < 0.001'].map((s) => (
          <div key={s} className={`${styles.statChip} ${styles.statChipSmall}`}>
            <span className={styles.statChipText}>{s}</span>
          </div>
        ))}
      </div>
      <div className={styles.expandedLink}>Open full →</div>
    </div>
  );
}

function B4ConfigFieldRow() {
  return (
    <div className={styles.configFields}>
      <div className={styles.configField}>
        <span className={styles.configLabel}>Journal Style</span>
        <div className={styles.configSelect}>
          <span className={styles.configSelectText}>NeurIPS</span>
          <ChevronDown />
        </div>
      </div>
      <div className={styles.configField}>
        <span className={styles.configLabel}>Focus Discipline</span>
        <div className={styles.configInput}>
          <span className={styles.configMono}>scientist</span>
        </div>
      </div>
    </div>
  );
}

function B5SectionLabel() {
  return (
    <div className={styles.sectionLabelSpecimen}>
      <span className={styles.sectionLabelText}>Tools</span>
    </div>
  );
}

function B6Divider() {
  return (
    <div className={styles.dividerGroup}>
      <div className={styles.dividerItem}>
        <div className={styles.dividerStandard} />
        <span className={styles.dividerLabel}>Standard</span>
      </div>
      <div className={styles.dividerItem}>
        <div className={styles.dividerSubtle} />
        <span className={styles.dividerLabel}>Subtle</span>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   GROUP 03 — INTERACTIVE CONTROLS
══════════════════════════════════════════ */

function C1PrimaryButton() {
  return (
    <div className={styles.buttonRow}>
      <button className={styles.primaryBtn}>Approve &amp; Proceed →</button>
      <span className={styles.linkText}>Open full →</span>
    </div>
  );
}

function C2GhostButton() {
  return (
    <button className={styles.ghostBtn}>Edit hypothesis</button>
  );
}

function C3IconButton() {
  return (
    <div className={styles.iconButtonRow}>
      {[<DownloadIcon key="dl" />, <CopyIcon key="cp" />, <CloseIcon key="cl" />].map((icon, i) => (
        <div key={i} className={styles.iconBtn}>{icon}</div>
      ))}
    </div>
  );
}

function C4PanelFooterButton() {
  return (
    <div className={styles.footerButtonWrap}>
      <button className={styles.footerBtn}>Export manuscript preview</button>
    </div>
  );
}

/* ══════════════════════════════════════════
   ROOT COMPONENT
══════════════════════════════════════════ */

export function PatternLibrary() {
  return (
    <div className={styles.root}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.titleGroup}>
          <p className={styles.title}>Pattern Library</p>
          <p className={styles.subtitle}>Sidebar &amp; Panel · Atoms · Academic Theme</p>
        </div>
        <div className={styles.legend}>
          <div className={styles.legendItem}>
            <div className={styles.legendLine} />
            <span className={styles.legendText}>Spacing annotation</span>
          </div>
          <div className={styles.legendItem}>
            <div className={styles.legendBox} />
            <span className={styles.legendText}>Sizing label</span>
          </div>
        </div>
        <div className={styles.divider} />
      </div>

      {/* 01 — Indicators & Badges */}
      <GroupHeader label="01 — Indicators & Badges" />
      <PatternRow id="A1" name="Stage Status Dot" notes="8px dot for complete/active · Lock icon for pipeline-locked stages · Consistent right-alignment in stage rows">
        <A1StatusDot />
      </PatternRow>
      <PatternRow id="A2" name="Active Stage Pill" notes="Height: 18px · Width: auto · Used only for the currently active pipeline stage">
        <A2ActiveStagePill />
      </PatternRow>
      <PatternRow id="A3" name="Mode Toggle Pill" notes="Active pill height: 22px · 4px gap between options · The group sits within 16px horizontal padding of sidebar">
        <A3ModeTogglePill />
      </PatternRow>
      <PatternRow id="A4" name="Progress Bar" notes="Track: #D4CDBF · Fill: #2D6A2D · Height: 3px · Width: fill-parent with 16px h-margin">
        <A4ProgressBar />
      </PatternRow>
      <PatternRow id="A5" name="Modified Badge" notes="Amber warning state · Appears in breadcrumb when file has unsaved edits · Height: 18px">
        <A5ModifiedBadge />
      </PatternRow>
      <PatternRow id="A6" name="File Chip" notes="Used in accordion expanded content · dot + filename + optional timestamp">
        <A6FileChip />
      </PatternRow>
      <PatternRow id="A7" name="Stat Chip" notes="Height: 22px · Used in Analysis card footer and accordion expanded content">
        <A7StatChip />
      </PatternRow>
      <PatternRow id="A8" name="Toggle Switch" notes="32 × 18px · circle diameter: 14px · 2px margin from edges · Used in config panel for Add Citations">
        <A8ToggleSwitch />
      </PatternRow>

      {/* 02 — Rows & Containers */}
      <GroupHeader label="02 — Rows & Containers" />
      <PatternRow id="B1" name="Stage Row (3 states)" notes="Row height: 40px · H-padding: 16px · Icon: 16×16px · Icon gap: 10px · Status indicator: right-aligned. Active state: #DEEADE bg fill · 4px radius · 2px left accent #2D6A2D">
        <B1StageRow />
      </PatternRow>
      <PatternRow id="B2" name="Accordion Row Header" notes="Row height: 44px · H-padding: 20px · Chevron: 12px · 2px left accent only on expanded state">
        <B2AccordionRowHeader />
      </PatternRow>
      <PatternRow id="B3" name="Accordion Expanded Block" notes="Inset bg: #F5F0E8 (slightly lighter than panel) · V-padding: 12px · Gap between elements: 8px">
        <B3AccordionExpanded />
      </PatternRow>
      <PatternRow id="B4" name="Config Field Row" notes="Control height: 32px · Label: 12px #6A6661 · 6px border-radius · 8px v-padding inside control · 4px gap between label and control">
        <B4ConfigFieldRow />
      </PatternRow>
      <PatternRow id="B5" name="Section Label" notes="10px · SemiBold · 1.2px letter-spacing · 16px left padding · 12px top margin from previous element · 6px bottom margin to first row">
        <B5SectionLabel />
      </PatternRow>
      <PatternRow id="B6" name="Divider" notes="Standard: #D4CDBF · Subtle: #EDE7D9 · Height: 1px · No margins on the line itself — use spacing on surrounding elements">
        <B6Divider />
      </PatternRow>

      {/* 03 — Interactive Controls */}
      <GroupHeader label="03 — Interactive Controls" />
      <PatternRow id="C1" name="Primary Button" notes="Default height: 36px · H-padding: 16px · Radius: 8px · Small variant: no container, just colored text">
        <C1PrimaryButton />
      </PatternRow>
      <PatternRow id="C2" name="Ghost Button" notes="Same dimensions as primary · Border: 1px #D8D2C6 · Text: #6A6661">
        <C2GhostButton />
      </PatternRow>
      <PatternRow id="C3" name="Icon Button" notes="Touch target: 32×32px · Icon: 16×16px centered · No background at rest">
        <C3IconButton />
      </PatternRow>
      <PatternRow id="C4" name="Panel Footer Button" notes="Height: 40px · Full panel width minus 20px each side · Radius: 6px · Center-aligned label">
        <C4PanelFooterButton />
      </PatternRow>

      {/* Footer */}
      <div className={styles.footer}>
        <div className={styles.divider} />
        <p className={styles.footerNote}>
          Denario Pattern Library · Atoms · Sidebar &amp; Panel · Academic Theme
        </p>
      </div>
    </div>
  );
}
