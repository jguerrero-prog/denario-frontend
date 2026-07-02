import styles from './IconSet.module.css';

type IconState = 'muted' | 'default' | 'active';

function Icon({ name, state = 'default', size = 24 }: { name: string; state?: IconState; size?: number }) {
  const colors: Record<IconState, string> = {
    muted: '#D8D2C6',
    default: '#6A6661',
    active: '#16A34A',
  };
  const color = colors[state];
  const strokeWidth = size <= 16 ? 1.5 : 1.5;

  const paths: Record<string, React.ReactNode> = {
    idea: <polygon points="12 2 22 12 12 22 2 12" />,
    methods: (
      <>
        <path d="M10 2v7.527a2 2 0 0 1-.211.896L4.72 20.55a1 1 0 0 0 .9 1.45h12.76a1 1 0 0 0 .9-1.45l-5.069-10.127A2 2 0 0 1 14 9.527V2" />
        <path d="M8.5 2h7" />
        <path d="M7 16h10" />
      </>
    ),
    analysis: (
      <>
        <path d="M18 20V10" />
        <path d="M12 20V4" />
        <path d="M6 20v-6" />
      </>
    ),
    'literature-review': (
      <>
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 0 3-3h7z" />
      </>
    ),
    'referee-report': (
      <>
        <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
        <path d="m9 14 2 2 4-4" />
      </>
    ),
    'nav-chevron-right': <path d="m9 18 6-6-6-6" />,
    'nav-chevron-down': <path d="m6 9 6 6 6-6" />,
    'settings-gear': (
      <>
        <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 0 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
        <circle cx="12" cy="12" r="3" />
      </>
    ),
    'external-link': (
      <>
        <path d="M15 3h6v6" />
        <path d="M10 14 21 3" />
        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      </>
    ),
    lock: (
      <>
        <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        <circle cx="12" cy="16" r="1" fill={color} />
      </>
    ),
    'lock-open': (
      <>
        <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 9.9-1" />
      </>
    ),
    download: (
      <>
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" x2="12" y1="15" y2="3" />
      </>
    ),
    copy: (
      <>
        <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
        <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
      </>
    ),
    'check-circle': (
      <>
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <path d="m9 11 3 3L22 4" />
      </>
    ),
    'close-x': (
      <>
        <path d="M18 6 6 18" />
        <path d="m6 6 12 12" />
      </>
    ),
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name]}
    </svg>
  );
}

interface IconCardProps {
  name: string;
  label: string;
  sublabel: string;
}

function IconCard({ name, label, sublabel }: IconCardProps) {
  return (
    <div className={styles.iconCellWrapper}>
      <div className={styles.specimenCard}>
        <div className={styles.mainPreview}>
          <Icon name={name} state="default" size={32} />
        </div>
        <div className={styles.statesRow}>
          <Icon name={name} state="muted" size={16} />
          <Icon name={name} state="default" size={16} />
          <Icon name={name} state="active" size={16} />
        </div>
      </div>
      <div className={styles.labelStack}>
        <p className={styles.iconName}>{label}</p>
        <p className={styles.iconSublabel}>{sublabel}</p>
      </div>
    </div>
  );
}

const ICONS: IconCardProps[] = [
  { name: 'idea',              label: 'idea',              sublabel: 'Stage 2: Hypothesis' },
  { name: 'methods',           label: 'methods',           sublabel: 'Stage 3: Protocol' },
  { name: 'analysis',          label: 'analysis',          sublabel: 'Stage 4: Compute' },
  { name: 'literature-review', label: 'literature-review', sublabel: 'Stage 6: Sources' },
  { name: 'referee-report',    label: 'referee-report',    sublabel: 'Stage 7: Peer review' },
  { name: 'nav-chevron-right', label: 'nav-chevron-right', sublabel: 'Tree expansion' },
  { name: 'nav-chevron-down',  label: 'nav-chevron-down',  sublabel: 'Menu expansion' },
  { name: 'settings-gear',     label: 'settings-gear',     sublabel: 'System config' },
  { name: 'external-link',     label: 'external-link',     sublabel: 'DOI / Source' },
  { name: 'lock',              label: 'lock',              sublabel: 'Pipeline gate' },
  { name: 'lock-open',         label: 'lock-open',         sublabel: 'Gate unlocked' },
  { name: 'download',          label: 'download',          sublabel: 'Export artefact' },
  { name: 'copy',              label: 'copy',              sublabel: 'Duplicate block' },
  { name: 'check-circle',      label: 'check-circle',      sublabel: 'Validated' },
  { name: 'close-x',           label: 'close-x',           sublabel: 'Dismiss / Reset' },
];

const REFERENCE_TABLE = [
  { name: 'input-prompt',      location: 'Sidebar: Stage 1',     behavior: 'Terminal prompt style; active green when stage is in progress' },
  { name: 'idea',              location: 'Sidebar: Stage 2',     behavior: 'Wide diamond; active green on generation; muted before unlock' },
  { name: 'methods',           location: 'Sidebar: Stage 3',     behavior: 'Beaker silhouette; animates fill during generation' },
  { name: 'analysis',          location: 'Sidebar: Stage 4',     behavior: 'Bar chart with regression line; bars fill incrementally during execution' },
  { name: 'paper',             location: 'Sidebar: Stage 5',     behavior: 'Two-column manuscript; active on compilation; muted until Stage 4 complete' },
  { name: 'literature-review', location: 'Sidebar: Stage 6',     behavior: 'Open book; active during database scan; locked before Stage 5 complete' },
  { name: 'referee-report',    location: 'Sidebar: Stage 7',     behavior: 'Clipboard with check; active during review simulation' },
  { name: 'keywords',          location: 'Sidebar: Stage 8',     behavior: 'Notched tag; active on extraction; final pipeline stage' },
  { name: 'nav-chevron-right', location: 'Accordion rows',       behavior: 'Points right in closed accordion rows' },
  { name: 'nav-chevron-down',  location: 'Accordion rows',       behavior: 'Points down when row is open' },
  { name: 'settings-gear',     location: 'Sidebar: bottom row',  behavior: 'Opens settings; neutral state always' },
  { name: 'external-link',     location: 'Project row',          behavior: 'Opens project folder in system; modal default' },
  { name: 'lock',              location: 'Sidebar: locked rows', behavior: 'Pipeline mode only; disappears in Modular mode' },
  { name: 'lock-open',         location: 'Sidebar: transition',  behavior: 'Shown briefly on stage unlock animation' },
  { name: 'download',          location: 'Panel: file output',   behavior: 'Downloads action for .tex, bib files' },
  { name: 'copy',              location: 'Code viewer: top bar', behavior: 'Copies all code to clipboard' },
  { name: 'check-circle',      location: 'Stages: completion',   behavior: 'Appears on completed stage row transitions' },
  { name: 'close-x',           location: 'Dialogs: modal close', behavior: 'Dismisses warning dialogs and panels' },
];

export function IconSet() {
  const row1 = ICONS.slice(0, 4);
  const row2 = ICONS.slice(4, 9);
  const row3 = ICONS.slice(9, 15);

  return (
    <div className={styles.page}>
      <div className={styles.container}>

        {/* Header */}
        <div className={styles.header}>
          <div className={styles.titleGroup}>
            <p className={styles.title}>Icon Set · Sidebar &amp; Panel</p>
            <p className={styles.subtitle}>STEM aesthetic · 16×16px · 1.5px stroke · Wide geometry</p>
          </div>
          <div className={styles.divider} role="separator" />
        </div>

        {/* Icon Grid */}
        <div className={styles.iconGrid}>
          {/* Row 1: placeholder + 4 icons */}
          <div className={styles.iconRow}>
            <div className={styles.emptyCell} />
            {row1.map(ic => <IconCard key={ic.name} {...ic} />)}
          </div>
          {/* Row 2: 5 icons */}
          <div className={styles.iconRow}>
            {row2.map(ic => <IconCard key={ic.name} {...ic} />)}
          </div>
          {/* Row 3: 6 icons */}
          <div className={styles.iconRow}>
            {row3.map(ic => <IconCard key={ic.name} {...ic} />)}
          </div>
        </div>

        {/* State Reference Guide */}
        <div className={styles.stateGuide}>
          <p className={styles.stateGuideLabel}>STATE REFERENCE GUIDE</p>
          <div className={styles.stateGuideGrid}>
            {ICONS.map(ic => (
              <div key={ic.name} className={styles.stateGuideCell}>
                <div className={styles.stateGuideRow}>
                  <Icon name={ic.name} state="muted" size={12} />
                  <Icon name={ic.name} state="default" size={12} />
                  <Icon name={ic.name} state="active" size={12} />
                </div>
                <p className={styles.stateGuideIconName}>{ic.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Reference Table */}
        <div className={styles.refTable}>
          <div className={styles.refTableHeader}>
            <span className={styles.refCol}>ICON NAME</span>
            <span className={styles.refCol}>LOCATION</span>
            <span className={styles.refColWide}>STATE BEHAVIOR</span>
          </div>
          {REFERENCE_TABLE.map((row, i) => (
            <div key={row.name} className={`${styles.refTableRow} ${i % 2 === 1 ? styles.refTableRowAlt : ''}`}>
              <span className={`${styles.refCol} ${styles.refIconName}`}>{row.name}</span>
              <span className={styles.refCol}>{row.location}</span>
              <span className={styles.refColWide}>{row.behavior}</span>
            </div>
          ))}
        </div>

        {/* Footer note */}
        <p className={styles.footerNote}>
          Icon design principle: wide geometric forms with precise angular cuts. Stroke: 1.5px, rounded linecaps. Sharp internal corners preserved. Horizontal emphasis reflects the wide analytical layout of STEM tools.
        </p>
      </div>
    </div>
  );
}
