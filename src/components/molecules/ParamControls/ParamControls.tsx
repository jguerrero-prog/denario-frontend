import { useRef, useEffect, useState } from 'react';
import styles from './ParamControls.module.css';
import type { SelectOption } from '../../../config/stageConfig';

// ── Icons ─────────────────────────────────────────────────────────────────────

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

function ChevronUpTinyIcon() {
  return (
    <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 15l-6-6-6 6" />
    </svg>
  );
}

function ChevronDownTinyIcon() {
  return (
    <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

// ── InfoTip ───────────────────────────────────────────────────────────────────

interface InfoTipProps {
  text: string;
}

export function InfoTip({ text }: InfoTipProps) {
  return (
    <span className={styles.infoTip} aria-label={text}>
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="16" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12.01" y2="8" />
      </svg>
      <span className={styles.infoTipBubble}>{text}</span>
    </span>
  );
}

// ── ParamSelect ───────────────────────────────────────────────────────────────

interface ParamSelectProps {
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
}

export function ParamSelect({ value, options, onChange }: ParamSelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selected = options.find(o => o.value === value);

  useEffect(() => {
    if (!open) return;
    function onOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, [open]);

  return (
    <div className={styles.wrapper} ref={ref}>
      <button
        type="button"
        className={`${styles.trigger} ${open ? styles.triggerOpen : ''}`}
        onClick={() => setOpen(o => !o)}
      >
        <span className={selected ? styles.triggerValue : `${styles.triggerValue} ${styles.triggerPlaceholder}`}>
          {selected?.label ?? 'Select…'}
        </span>
        <span className={`${styles.triggerChevron} ${open ? styles.triggerChevronOpen : ''}`}>
          <ChevronDownIcon />
        </span>
      </button>

      {open && (
        <div className={styles.panel}>
          {options.map(opt => {
            const isSelected = opt.value === value;
            return (
              <div
                key={opt.value}
                className={`${styles.optionRow} ${isSelected ? styles.optionRowSelected : ''}`}
                onClick={() => { onChange(opt.value); setOpen(false); }}
              >
                <span className={styles.checkIcon}>
                  {isSelected && <CheckIcon />}
                </span>
                <span className={`${styles.optionLabel} ${isSelected ? styles.optionLabelSelected : ''}`}>
                  {opt.label}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── ParamNumber ───────────────────────────────────────────────────────────────

interface ParamNumberProps {
  value: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
}

export function ParamNumber({ value, min, max, onChange }: ParamNumberProps) {
  const [raw, setRaw] = useState(String(value));

  function commit(str: string) {
    const n = parseInt(str, 10);
    if (isNaN(n)) { setRaw(String(value)); return; }
    const clamped = Math.min(max ?? Infinity, Math.max(min ?? -Infinity, n));
    setRaw(String(clamped));
    onChange(clamped);
  }

  function step(delta: number) {
    const next = Math.min(max ?? Infinity, Math.max(min ?? -Infinity, value + delta));
    setRaw(String(next));
    onChange(next);
  }

  // keep raw in sync when value changes from outside
  if (raw !== String(value) && document.activeElement?.tagName !== 'INPUT') {
    setRaw(String(value));
  }

  return (
    <div className={styles.numberWrapper}>
      <input
        className={styles.numberInput}
        type="number"
        value={raw}
        min={min}
        max={max}
        onChange={e => setRaw(e.target.value)}
        onBlur={e => commit(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') commit((e.target as HTMLInputElement).value); }}
      />
      <div className={styles.stepperCol}>
        <button
          className={styles.stepBtn}
          onClick={() => step(1)}
          disabled={max !== undefined && value >= max}
          aria-label="Increase"
        >
          <ChevronUpTinyIcon />
        </button>
        <button
          className={styles.stepBtn}
          onClick={() => step(-1)}
          disabled={min !== undefined && value <= min}
          aria-label="Decrease"
        >
          <ChevronDownTinyIcon />
        </button>
      </div>
    </div>
  );
}

// ── ParamText ─────────────────────────────────────────────────────────────────

interface ParamTextProps {
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
}

export function ParamText({ value, placeholder, onChange }: ParamTextProps) {
  return (
    <input
      className={styles.textInput}
      type="text"
      value={value}
      placeholder={placeholder}
      onChange={e => onChange(e.target.value)}
    />
  );
}

// ── ParamToggle ───────────────────────────────────────────────────────────────

interface ParamToggleProps {
  value: boolean;
  onChange: (value: boolean) => void;
}

export function ParamToggle({ value, onChange }: ParamToggleProps) {
  return (
    <div className={styles.toggleWrapper}>
      <button
        type="button"
        className={`${styles.toggleTrack} ${value ? styles.toggleTrackOn : ''}`}
        onClick={() => onChange(!value)}
        aria-pressed={value}
      >
        <span className={styles.toggleKnob} />
      </button>
      <span className={`${styles.toggleState} ${value ? styles.toggleStateOn : ''}`}>
        {value ? 'On' : 'Off'}
      </span>
    </div>
  );
}
