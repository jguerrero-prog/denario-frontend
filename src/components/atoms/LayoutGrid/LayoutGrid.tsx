import styles from './LayoutGrid.module.css';

const zones = [
  {
    id: 'sidebar',
    name: 'Left Sidebar',
    size: '200–232px',
    flex: '0 0 16.03%',
    variant: 'green' as const,
    borderSide: 'right' as const,
  },
  {
    id: 'conversation',
    name: 'Conversation Column',
    sub: 'fills remaining space',
    mono: '~780–860px at 1440px canvas',
    flex: '1 1 0',
    variant: 'neutral' as const,
  },
  {
    id: 'panel',
    name: 'Right Panel',
    size: '300–320px',
    flex: '0 0 23.09%',
    variant: 'green' as const,
    borderSide: 'left' as const,
  },
];

const dimensionLabels = [
  { text: '200px min · 232px default', flex: '0 0 16.03%' },
  { text: '1440 – 200 – 320 = 920px (fluid)', flex: '1 1 0', center: true },
  { text: '320px fixed · 300px compact', flex: '0 0 23.09%' },
];

const breakdownRows = [
  {
    zone: 'Left',
    component: 'Sidebar — Pipeline stage nav, project info, user',
    width: '200px default',
    notes: 'Expands to 232px in dark theme',
  },
  {
    zone: 'Center',
    component: 'Conversation — Message thread, artifact cards, input bar',
    width: 'Fluid',
    notes: 'Max-width 700px content column centered inside',
  },
  {
    zone: 'Right',
    component: 'Panel — Outputs accordion / Configuration drawer',
    width: '300–320px',
    notes: 'Slides in/out; hidden by default on home screen',
  },
];

const spacingNotes = [
  'Conversation column content max-width: 700px (centered with ~80px horizontal padding each side)',
  'Input bar aligned to same 700px max-width as conversation content',
  'Top breadcrumb bar height: 40px',
  'Panel header height: 48px · Panel footer height: 52px',
];

export function LayoutGrid() {
  return (
    <div className={styles.root}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.titleGroup}>
          <p className={styles.title}>Layout Grid</p>
          <p className={styles.subtitle}>Desktop · 1440px canvas · 3-zone layout</p>
        </div>
        <div className={styles.divider} />
      </div>

      {/* Diagram */}
      <div className={styles.diagramSection}>
        <div
          className={styles.diagram}
          role="img"
          aria-label="3-zone layout diagram: left sidebar, conversation column, right panel"
        >
          {zones.map((z) => (
            <div
              key={z.id}
              className={`${styles.zone} ${styles[`zone--${z.variant}`]} ${
                z.borderSide ? styles[`zone--border-${z.borderSide}`] : ''
              }`}
              style={{ flex: z.flex }}
            >
              <p className={styles.zoneName}>{z.name}</p>
              {z.size && <p className={styles.zoneMono}>{z.size}</p>}
              {z.sub && <p className={styles.zoneSub}>{z.sub}</p>}
              {z.mono && <p className={styles.zoneMono}>{z.mono}</p>}
            </div>
          ))}
        </div>

        {/* Dimension labels */}
        <div className={styles.dimRow}>
          {dimensionLabels.map((d, i) => (
            <div
              key={i}
              className={`${styles.dimCell} ${d.center ? styles['dimCell--center'] : ''}`}
              style={{ flex: d.flex }}
            >
              {!d.center && <div className={styles.dimLine} />}
              <p className={styles.dimText}>{d.text}</p>
            </div>
          ))}
        </div>

        {/* Total canvas label */}
        <div className={styles.totalRow}>
          <div className={styles.totalLine} />
          <p className={styles.totalLabel}>← 1440px total canvas →</p>
          <div className={styles.totalLine} />
        </div>
      </div>

      {/* Column Breakdown table */}
      <div className={styles.section}>
        <p className={styles.sectionLabel}>Column Breakdown</p>
        <div className={styles.table}>
          <div className={`${styles.tableRow} ${styles.tableHead}`}>
            <span className={`${styles.cell} ${styles.cellZone}`}>Zone</span>
            <span className={`${styles.cell} ${styles.cellComponent}`}>Component</span>
            <span className={`${styles.cell} ${styles.cellWidth}`}>Width</span>
            <span className={`${styles.cell} ${styles.cellNotes}`}>Notes</span>
          </div>
          {breakdownRows.map((row, i) => (
            <div
              key={row.zone}
              className={`${styles.tableRow} ${i < breakdownRows.length - 1 ? styles.tableRowBorder : ''}`}
            >
              <span className={`${styles.cell} ${styles.cellZone} ${styles.cellZoneBody}`}>
                {row.zone}
              </span>
              <span className={`${styles.cell} ${styles.cellComponent} ${styles.cellBody}`}>
                {row.component}
              </span>
              <span className={`${styles.cell} ${styles.cellWidth} ${styles.cellMono}`}>
                {row.width}
              </span>
              <span className={`${styles.cell} ${styles.cellNotes} ${styles.cellNoteBody}`}>
                {row.notes}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Key Spacing */}
      <div className={styles.section}>
        <p className={styles.sectionLabel}>Key Spacing</p>
        <div className={styles.spacingList}>
          {spacingNotes.map((note) => (
            <p key={note} className={styles.spacingNote}>
              {note}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
