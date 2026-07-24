import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { api } from '../../api/client';
import styles from './PlotLightbox.module.css';

// ── Props & component ──────────────────────────────────────────────────────────

export interface PlotLightboxProps {
  plots: string[];
  currentIndex: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
  backendProjectId?: string | null;
  // Keyed by filename, from AnalysisResultData.plotCaptions (derived from the
  // real report — see derivePlotCaptions in utils/parsers.ts). Never
  // fabricated: no caption for a filename just means the "Figure N." fallback
  // below, not an invented one.
  captions?: Record<string, string>;
}

function truncate(name: string, max = 11) {
  const base = name.replace('.png', '');
  return base.length > max ? base.slice(0, max - 1) + '…' : base;
}

function PlotImage({
  name,
  backendProjectId,
}: {
  name: string;
  backendProjectId?: string | null;
}) {
  const [failed, setFailed] = useState(false);

  if (backendProjectId && !failed) {
    const src = api.fileUrl(backendProjectId, `input_files/plots/${name}`);
    return (
      <img
        key={src}
        src={src}
        alt={name}
        className={styles.plotImg}
        onError={() => setFailed(true)}
      />
    );
  }

  // No invented chart when the real image isn't available (no backend
  // project, or the file failed to load) — an honest empty state instead of
  // one of two hand-drawn mock SVGs that used to show regardless of `name`.
  return (
    <div className={styles.noPreview}>
      <p className={styles.noPreviewText}>Preview unavailable</p>
      <p className={styles.noPreviewName}>{name}</p>
    </div>
  );
}

export function PlotLightbox({ plots, currentIndex, onClose, onNavigate, backendProjectId, captions }: PlotLightboxProps) {
  const current = plots[currentIndex] ?? plots[0];
  const caption = captions?.[current] ?? `Figure ${currentIndex + 1}.`;

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft')  onNavigate(Math.max(0, currentIndex - 1));
      if (e.key === 'ArrowRight') onNavigate(Math.min(plots.length - 1, currentIndex + 1));
    }
    document.addEventListener('keydown', handleKey);
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleKey);
    };
  }, [currentIndex, plots.length, onClose, onNavigate]);

  return createPortal(
    <div className={styles.overlay} onClick={onClose}>
      {/* Top bar */}
      <div className={styles.topBar} onClick={e => e.stopPropagation()}>
        <button className={styles.backLink} onClick={onClose}>← Analysis Results</button>
        <span className={styles.topCenter}>{current}</span>
        <div className={styles.topRight}>
          <span className={styles.counter}>{currentIndex + 1} / {plots.length}</span>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">×</button>
        </div>
      </div>

      {/* Main content */}
      <div className={styles.mainArea} onClick={e => e.stopPropagation()}>
        {/* Left nav */}
        <button
          className={styles.navBtn}
          onClick={() => onNavigate(Math.max(0, currentIndex - 1))}
          disabled={currentIndex === 0}
          aria-label="Previous plot"
        >
          ‹
        </button>

        {/* Active plot card */}
        <div className={styles.plotCard}>
          <div className={styles.chartArea}>
            <PlotImage
              name={current}
              backendProjectId={backendProjectId}
            />
          </div>
          <p className={styles.caption}>{caption}</p>
        </div>

        {/* Right nav */}
        <button
          className={styles.navBtn}
          onClick={() => onNavigate(Math.min(plots.length - 1, currentIndex + 1))}
          disabled={currentIndex === plots.length - 1}
          aria-label="Next plot"
        >
          ›
        </button>
      </div>

      {/* Bottom thumbnail strip */}
      <div className={styles.thumbStrip} onClick={e => e.stopPropagation()}>
        <div className={styles.thumbRow}>
          {plots.map((name, i) => (
            <button
              key={name}
              className={`${styles.thumb} ${i === currentIndex ? styles.thumbActive : ''}`}
              onClick={() => onNavigate(i)}
              aria-label={name}
              aria-pressed={i === currentIndex}
            >
              <div className={styles.thumbIcon}>
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                  <rect x="2" y="10" width="3" height="7" rx="1" fill="currentColor" opacity=".7" />
                  <rect x="7" y="6" width="3" height="11" rx="1" fill="currentColor" opacity=".85" />
                  <rect x="12" y="2" width="3" height="15" rx="1" fill="currentColor" />
                </svg>
              </div>
              <span className={styles.thumbLabel}>{truncate(name)}</span>
            </button>
          ))}
        </div>
        <div
          className={styles.activeDot}
          style={{ transform: `translateX(${currentIndex * 128}px)` }}
        />
      </div>
    </div>,
    document.body,
  );
}
