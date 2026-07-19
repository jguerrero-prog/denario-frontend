import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useParams } from 'react-router-dom';
import { usePipelineStore } from '../../../store/pipelineStore';
import { useBackendStatus } from '../../../hooks/useBackendStatus';
import { ApiKeysModal } from '../../molecules/ApiKeysModal/ApiKeysModal';
import { STAGE_CONFIG } from '../../../config/stageConfig';
import type { StageStatus, StageId } from '../../../types/pipeline';
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

function MessageSquareIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function LightbulbIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
      <path d="M9 18h6M10 22h4" />
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

function BarChartIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 20V10M12 20V4M6 20v-6" />
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

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  );
}

function ClipboardCheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
      <rect x="9" y="3" width="6" height="4" rx="1" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function TagIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
      <circle cx="7" cy="7" r="1.5" fill="currentColor" stroke="none" />
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

function LockIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

// ── Brand ──────────────────────────────────────────────────────────────────────

const BRAND_COLORS = ['#16A34A', '#EA580C', '#2563EB', '#7C3AED'];

// ── Stage definitions ─────────────────────────────────────────────────────────

type StageIcon = React.ComponentType;

const STAGES: { id: string; label: string; Icon: StageIcon }[] = [
  { id: 'input',      label: 'Input Prompt',     Icon: MessageSquareIcon  },
  { id: 'idea',       label: 'Idea',             Icon: LightbulbIcon      },
  { id: 'methods',    label: 'Methods',           Icon: FlaskIcon          },
  { id: 'analysis',   label: 'Analysis',          Icon: BarChartIcon       },
  { id: 'paper',      label: 'Paper',             Icon: FileTextIcon       },
  { id: 'literature', label: 'Literature Review', Icon: SearchIcon         },
  { id: 'referee',    label: 'Referee Report',    Icon: ClipboardCheckIcon },
  { id: 'keywords',   label: 'Keywords',          Icon: TagIcon            },
];

// ── Props ─────────────────────────────────────────────────────────────────────

export interface SidebarProps {
  defaultMode?: 'pipeline' | 'modular';
  userEmail?: string;
  projectName?: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function Sidebar({
  defaultMode = 'pipeline',
  userEmail = 'researcher@lab.edu',
  projectName,
}: SidebarProps) {
  const navigate = useNavigate();
  const params = useParams<{ projectId?: string; stageId?: string }>();
  const pipeline = usePipelineStore(s => s.pipeline);
  const ensureStagePrompt = usePipelineStore(s => s.ensureStagePrompt);

  const [mode, setMode] = useState<'pipeline' | 'modular'>(defaultMode);
  const [collapsed, setCollapsed] = useState(false);
  const [showApiKeys, setShowApiKeys] = useState(false);
  const [hoveredTooltip, setHoveredTooltip] = useState<{ label: string; rect: DOMRect } | null>(null);

  function showTooltip(e: React.MouseEvent<HTMLElement>, label: string) {
    setHoveredTooltip({ label, rect: e.currentTarget.getBoundingClientRect() });
  }

  function hideTooltip() {
    setHoveredTooltip(null);
  }
  const backendStatus = useBackendStatus();

  // Derive from URL — the URL is the source of truth for which stage is shown
  const activeStageId = params.stageId ?? '';
  const projectId = params.projectId ?? pipeline?.id ?? null;

  const displayName = projectName ?? pipeline?.name ?? null;

  function getStatus(stageId: string): StageStatus {
    return (pipeline?.stages[stageId as keyof typeof pipeline.stages]?.status) ?? 'locked';
  }

  function canNavigate(stageId: string): boolean {
    if (!projectId) return false;
    if (mode === 'modular') return true;
    const status = getStatus(stageId);
    return status !== 'locked';
  }

  function handleStageClick(stageId: string) {
    if (!canNavigate(stageId)) return;
    if (mode === 'modular') ensureStagePrompt(stageId as StageId);
    navigate(`/project/${projectId}/stage/${stageId}`);
  }

  function rowClass(stageId: string): string {
    const classes = [styles.stageRow];
    if (stageId === activeStageId) {
      classes.push(styles.stageActive);
    } else if (canNavigate(stageId)) {
      classes.push(styles.stageAccessible);
    } else {
      classes.push(styles.stageLocked);
    }
    return classes.join(' ');
  }

  return (
    <>
    <div className={`${styles.sidebarShell} ${collapsed ? styles.sidebarShellCollapsed : ''}`}>
    <div className={styles.sidebarBacking} />
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

      {/* Pipeline / Modular toggle — kept in the layout (not unmounted) when
          collapsed, just made invisible, so the stage icons below don't shift. */}
      <div className={styles.toggleSection}>
        <div className={styles.togglePill}>
          <button
            className={`${styles.toggleOption} ${mode === 'pipeline' ? styles.toggleActive : ''}`}
            onClick={() => setMode('pipeline')}
          >
            Pipeline
          </button>
          <button
            className={`${styles.toggleLabel} ${mode === 'modular' ? styles.toggleActive : ''}`}
            onClick={() => setMode('modular')}
          >
            Modular
          </button>
        </div>
        <p className={styles.toggleCaption}>
          {mode === 'pipeline'
            ? 'Sequential · stages unlock in order'
            : STAGE_CONFIG[activeStageId as StageId]?.modularEntry.subheader ?? 'Any stage, any time'}
        </p>
      </div>

      <div className={`${styles.sidebarDivider} ${styles.toggleAreaDivider}`} />

      <div className={styles.sectionLabel}>Tools</div>

      {/* Stage navigation */}
      <nav className={styles.stageNav}>
        {STAGES.map(({ id, label, Icon }) => {
          const locked = !canNavigate(id);
          return (
            <button
              key={id}
              className={rowClass(id)}
              onClick={() => handleStageClick(id)}
              aria-current={id === activeStageId ? 'page' : undefined}
              onMouseEnter={collapsed ? (e => showTooltip(e, label)) : undefined}
              onMouseLeave={collapsed ? hideTooltip : undefined}
            >
              <span className={styles.stageIcon}><Icon /></span>
              {!collapsed && <span className={styles.stageLabel}>{label}</span>}
              {!collapsed && locked && mode === 'pipeline' &&
                <span className={styles.stageLockIcon}><LockIcon /></span>
              }
            </button>
          );
        })}
      </nav>

      <div className={styles.sidebarDivider} />

      {!collapsed && (
        <>
          {/* Project */}
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
        </>
      )}

      {/* Spacer */}
      <div className={styles.sidebarSpacer} />

      {/* Bottom */}
      <div className={styles.sidebarBottom}>
        <div className={styles.sidebarDivider} />
        <button
          className={styles.newProjectBtn}
          onClick={() => navigate('/')}
          onMouseEnter={collapsed ? (e => showTooltip(e, 'New project')) : undefined}
          onMouseLeave={collapsed ? hideTooltip : undefined}
        >
          {collapsed ? '+' : '+ New project'}
        </button>
        <div className={styles.sidebarDivider} />
        <div className={styles.userRow}>
          <div className={styles.userInfo}>
            <div className={styles.userAvatar}>{userEmail[0].toUpperCase()}</div>
            {!collapsed && <span className={styles.userEmail}>{userEmail}</span>}
          </div>
          <button
            className={styles.settingsBtn}
            aria-label="Settings"
            onClick={() => setShowApiKeys(true)}
            onMouseEnter={e => showTooltip(e, 'Settings')}
            onMouseLeave={hideTooltip}
          >
            <SettingsIcon />
          </button>
        </div>
      </div>
    </aside>
    </div>

    {hoveredTooltip && <IconTooltip label={hoveredTooltip.label} anchorRect={hoveredTooltip.rect} />}
    {showApiKeys && <ApiKeysModal onClose={() => setShowApiKeys(false)} />}
    </>
  );
}
