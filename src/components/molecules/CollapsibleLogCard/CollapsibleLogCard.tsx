import { useEffect, useRef, useState } from 'react';
import styles from './CollapsibleLogCard.module.css';

// Generic collapsible-card chrome shared by every per-stage reasoning-log
// view (Idea's adversarial transcript today; Methods' planning loop + step
// list next) — chevron/title/header-right row, collapse state, and the
// "force-collapse once on completion" behaviour, with zero knowledge of what
// the specific log actually contains. Callers own their own content and
// empty-state messaging entirely via children.

function ChevronRightIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}

export function CollapsibleLogCard({
  title,
  defaultCollapsed,
  collapseTrigger,
  headerRight,
  children,
}: {
  title: string;
  defaultCollapsed: boolean;
  collapseTrigger?: boolean;   // rising edge (false → true) force-collapses once, e.g. on stage completion
  headerRight?: React.ReactNode;
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const prevTriggerRef = useRef(collapseTrigger ?? false);

  useEffect(() => {
    if (collapseTrigger && !prevTriggerRef.current) setCollapsed(true);
    prevTriggerRef.current = collapseTrigger ?? false;
  }, [collapseTrigger]);

  return (
    <div className={styles.card}>
      <button
        type="button"
        className={styles.header}
        onClick={() => setCollapsed(c => !c)}
        aria-expanded={!collapsed}
      >
        <span className={`${styles.chevron} ${collapsed ? '' : styles.chevronOpen}`}>
          <ChevronRightIcon />
        </span>
        <span className={styles.title}>{title}</span>
        <span className={styles.headerRight}>{headerRight}</span>
      </button>
      {!collapsed && children}
    </div>
  );
}
