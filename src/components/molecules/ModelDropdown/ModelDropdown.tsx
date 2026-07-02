import { useRef, useEffect, useState } from 'react';
import styles from './ModelDropdown.module.css';

export interface ModelGroup {
  provider: string;
  models: string[];
}

interface ModelDropdownProps {
  value: string;
  options: ModelGroup[];
  onChange?: (value: string) => void;
}

function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 6.5L4.5 9 10 3.5" />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

export function ModelDropdown({ value, options, onChange }: ModelDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onOutsideClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onOutsideClick);
    return () => document.removeEventListener('mousedown', onOutsideClick);
  }, [open]);

  return (
    <div className={styles.wrapper} ref={ref}>
      <button
        type="button"
        className={`${styles.trigger} ${open ? styles.triggerOpen : ''}`}
        onClick={() => setOpen(o => !o)}
      >
        <span className={styles.triggerValue}>{value}</span>
        <span className={`${styles.triggerChevron} ${open ? styles.triggerChevronOpen : ''}`}>
          <ChevronDownIcon />
        </span>
      </button>

      {open && (
        <div className={styles.panel}>
          {options.map((group, gi) => (
            <div key={group.provider}>
              {gi > 0 && <div className={styles.divider} />}
              <p className={styles.providerHeader}>{group.provider}</p>
              {group.models.map(model => {
                const selected = model === value;
                return (
                  <div
                    key={model}
                    className={`${styles.modelRow} ${selected ? styles.modelRowSelected : ''}`}
                    onClick={() => { onChange?.(model); setOpen(false); }}
                  >
                    {selected && (
                      <span className={styles.checkIcon}>
                        <CheckIcon />
                      </span>
                    )}
                    <span className={`${styles.modelLabel} ${selected ? styles.modelLabelSelected : ''}`}>
                      {model}
                    </span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
