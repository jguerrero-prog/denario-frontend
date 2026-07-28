import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { usePipelineStore } from '../../../store/pipelineStore';
import { useBackendStatus } from '../../../hooks/useBackendStatus';
import { SettingsModal } from '../../molecules/SettingsModal/SettingsModal';
import styles from './Sidebar.module.css';

// ── Collapsed-rail hover tooltip (portalled — the sidebar clips overflow-x,
// so an absolutely-positioned bubble inside it would get cut off) ─────────────

function IconTooltip({ label, anchorRect }: { label: string; anchorRect: DOMRect }) {
  return createPortal(
    <div
      className={styles.iconTooltip}
      style={{
        top: anchorRect.top + anchorRect.height / 2,
        left: anchorRect.right + 8,
      }}
    >
      {label}
    </div>,
    document.body,
  );
}

// ── Icon components ───────────────────────────────────────────────────────────

function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function FlaskIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M10 2v7.31a2 2 0 0 1-.21.9L4.72 20.55A1 1 0 0 0 5.6 22h12.8a1 1 0 0 0 .9-1.45L14.2 10.2A2 2 0 0 1 14 9.3V2" />
      <path d="M8.5 2h7" />
    </svg>
  );
}

function FileTextIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

function PanelLeftIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M9 3v18" />
    </svg>
  );
}

// ── Brand ──────────────────────────────────────────────────────────────────────

const BRAND_COLORS = ['#16A34A', '#EA580C', '#2563EB', '#7C3AED'];

// ── Nav definitions ───────────────────────────────────────────────────────────
// The app-shell nav (New / Lab / Paper) — stage-by-stage navigation used to
// live here (a hardcoded stage list + lock icons + a Pipeline/Modular mode
// toggle), but that's now redundant: stage progression moves into the
// Compose Bar (see ROADMAP.md's Epic 6) once it's built out. Lab and Paper
// are placeholder destinations for now (see LabPage/PaperPage) — their real
// scope is written up in ROADMAP.md, not built yet.

type NavIcon = React.ComponentType;

const NAV_ITEMS: { label: string; Icon: NavIcon; path: string }[] = [
  { label: 'New',   Icon: PlusIcon,     path: '/' },
  { label: 'Lab',   Icon: FlaskIcon,    path: '/lab' },
  { label: 'Paper', Icon: FileTextIcon, path: '/paper' },
];

// ── Props ─────────────────────────────────────────────────────────────────────

export interface SidebarProps {
  projectName?: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function Sidebar({ projectName }: SidebarProps) {
  const navigate = useNavigate();
  const pipeline = usePipelineStore(s => s.pipeline);

  const [collapsed, setCollapsed] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [hoveredTooltip, setHoveredTooltip] = useState<{ label: string; rect: DOMRect } | null>(null);

  function showTooltip(e: React.MouseEvent<HTMLElement>, label: string) {
    setHoveredTooltip({ label, rect: e.currentTarget.getBoundingClientRect() });
  }

  function hideTooltip() {
    setHoveredTooltip(null);
  }
  const backendStatus = useBackendStatus();

  const displayName = projectName ?? pipeline?.name ?? null;

  return (
    <>
    <div className={`${styles.sidebarShell} ${collapsed ? styles.sidebarShellCollapsed : ''}`}>
    <aside className={`${styles.sidebar} ${collapsed ? styles.sidebarCollapsed : ''}`}>
      {/* Top: wordmark + brand bar + collapse */}
      <div className={styles.sidebarTop}>
        {collapsed ? (
          <div className={styles.brandRing} aria-hidden="true" />
        ) : (
          <div className={styles.logoGroup}>
            <p className={styles.logoText}>Denario</p>
            <div className={styles.brandBar}>
              {BRAND_COLORS.map(color => (
                <div key={color} className={styles.brandBarSegment} style={{ background: color }} />
              ))}
            </div>
          </div>
        )}
        <button
          className={styles.collapseBtn}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          onClick={() => setCollapsed(c => !c)}
          onMouseEnter={e => showTooltip(e, collapsed ? 'Expand sidebar' : 'Collapse sidebar')}
          onMouseLeave={hideTooltip}
        >
          <PanelLeftIcon />
        </button>
      </div>

      <div className={styles.sidebarDivider} />

      {/* App nav */}
      <nav className={styles.appNav}>
        {NAV_ITEMS.map(({ label, Icon, path }) => (
          <button
            key={label}
            className={styles.navRow}
            onClick={() => navigate(path)}
            onMouseEnter={collapsed ? (e => showTooltip(e, label)) : undefined}
            onMouseLeave={collapsed ? hideTooltip : undefined}
          >
            <span className={styles.navIcon}><Icon /></span>
            {!collapsed && <span className={styles.navLabel}>{label}</span>}
          </button>
        ))}
      </nav>

      <div className={styles.sidebarDivider} />

      {!collapsed && (
        <div className={styles.projectSection}>
          <p className={styles.sectionLabel}>Project</p>
          <p className={styles.projectName}>{displayName ?? 'No project open'}</p>
          <div className={styles.backendStatus} title={
            backendStatus === 'connected' ? 'Backend connected'
            : backendStatus === 'offline'  ? 'Backend offline — running in mock mode'
            : 'Connecting to backend…'
          }>
            <span className={`${styles.statusDot} ${styles[`statusDot_${backendStatus}`]}`} />
            <span className={styles.statusLabel}>
              {backendStatus === 'connected' ? 'Connected'
               : backendStatus === 'offline'  ? 'Offline'
               : 'Connecting…'}
            </span>
          </div>
        </div>
      )}

      {/* Spacer */}
      <div className={styles.sidebarSpacer} />

      {/* Bottom */}
      <div className={styles.sidebarBottom}>
        <div className={styles.sidebarDivider} />
        <div className={styles.settingsRow}>
          <button
            className={styles.settingsBtn}
            onClick={() => setShowSettings(true)}
            onMouseEnter={collapsed ? (e => showTooltip(e, 'Settings')) : undefined}
            onMouseLeave={collapsed ? hideTooltip : undefined}
          >
            <SettingsIcon />
            {!collapsed && <span className={styles.navLabel}>Settings</span>}
          </button>
        </div>
      </div>
    </aside>
    </div>

    {hoveredTooltip && <IconTooltip label={hoveredTooltip.label} anchorRect={hoveredTooltip.rect} />}
    {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </>
  );
}
