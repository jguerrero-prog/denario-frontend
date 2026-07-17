import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { api } from '../../api/client';
import styles from './PlotLightbox.module.css';

// ── Chart SVG (co2_temp_timeseries mock) ──────────────────────────────────────

const CO2_PTS  = [[0,442],[164,368],[328,262],[492,218],[656,128],[820,16]] as [number,number][];
const TEMP_PTS = [[0,416],[164,336],[328,368],[492,208],[656,112],[820,16]] as [number,number][];

function toPolyline(pts: [number,number][], ox = 29, oy = 20) {
  return pts.map(([x,y]) => `${x+ox},${y+oy}`).join(' ');
}

function Co2TempChart() {
  return (
    <svg viewBox="0 0 880 548" className={styles.chartSvg} aria-label="CO₂ temperature time-series chart">
      <rect width="880" height="548" fill="white" />
      {/* Grid lines */}
      {[0,160,320,480].map(y => (
        <line key={y} x1="28" y1={y+20} x2="849" y2={y+20} stroke="#e8e4de" strokeWidth="1" />
      ))}
      {/* CO2 line */}
      <polyline points={toPolyline(CO2_PTS)} fill="none" stroke="#2563eb" strokeWidth="1.75" strokeLinejoin="round" />
      {CO2_PTS.map(([x,y],i) => <circle key={i} cx={x+29} cy={y+20} r="3" fill="#2563eb" />)}
      {/* Temp line (dashed orange) */}
      <polyline points={toPolyline(TEMP_PTS)} fill="none" stroke="#ea580c" strokeWidth="1.75" strokeDasharray="5 3" strokeLinejoin="round" />
      {TEMP_PTS.map(([x,y],i) => <circle key={i} cx={x+29} cy={y+20} r="3" fill="#ea580c" />)}
      {/* Left Y-axis labels */}
      {(['425','420','415','410'] as const).map((v,i) => (
        <text key={v} x="22" y={20 + i*160 + 4} fontSize="11" fill="#888" textAnchor="end">{v}</text>
      ))}
      {/* Right Y-axis labels */}
      {(['1.5','1.0','0.5','0.0'] as const).map((v,i) => (
        <text key={v} x="856" y={20 + i*160 + 4} fontSize="11" fill="#888" textAnchor="start">{v}</text>
      ))}
      {/* X-axis labels */}
      {[2019,2020,2021,2022,2023,2024].map((yr,i) => (
        <text key={yr} x={29 + i*164} y="514" fontSize="11" fill="#888" textAnchor="middle">{yr}</text>
      ))}
      {/* Legend */}
      <rect x="649" y="420" width="184" height="50" fill="white" stroke="#d4cdbf" strokeWidth="1" rx="4" />
      <line x1="659" y1="433" x2="672" y2="433" stroke="#2563eb" strokeWidth="1.75" />
      <text x="678" y="437" fontSize="10" fill="#555">CO₂ concentration (ppm)</text>
      <line x1="659" y1="451" x2="672" y2="451" stroke="#ea580c" strokeWidth="1.75" strokeDasharray="5 3" />
      <text x="678" y="455" fontSize="10" fill="#555">Temp. anomaly (°C)</text>
    </svg>
  );
}

function PlaceholderChart({ name }: { name: string }) {
  return (
    <svg viewBox="0 0 880 520" className={styles.chartSvg} aria-label={name}>
      <rect width="880" height="520" fill="white" />
      {[0,130,260,390].map(y => (
        <line key={y} x1="40" y1={y+40} x2="840" y2={y+40} stroke="#e8e4de" strokeWidth="1" />
      ))}
      <rect x="80" y="320" width="80" height="110" fill="#deeade" rx="2" />
      <rect x="200" y="240" width="80" height="190" fill="#deeade" rx="2" />
      <rect x="320" y="180" width="80" height="250" fill="#deeade" rx="2" />
      <rect x="440" y="140" width="80" height="290" fill="#deeade" rx="2" />
      <rect x="560" y="90" width="80" height="340" fill="#deeade" rx="2" />
      <rect x="680" y="50" width="80" height="380" fill="#deeade" rx="2" />
    </svg>
  );
}

// ── Props & component ──────────────────────────────────────────────────────────

export interface PlotLightboxProps {
  plots: string[];
  currentIndex: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
  backendProjectId?: string | null;
}

const PLOT_CAPTIONS: Record<string, string> = {
  'co2_temp_timeseries.png': 'Figure 1. Monthly CO₂ concentration and surface temperature anomaly, 2019–2024. Pearson r = 0.847, p < 0.001.',
  'correlation_heatmap.png': 'Figure 2. Pearson correlation heatmap across all variable pairs.',
  'residuals_plot.png':      'Figure 3. OLS residuals vs. fitted values — minor heteroscedasticity at upper tail.',
  'distribution_co2.png':    'Figure 4. Distribution of CO₂ concentration (ppm) across 2019–2024.',
  'distribution_temp.png':   'Figure 5. Distribution of surface temperature anomaly (°C) across 2019–2024.',
  'qq_plot.png':             'Figure 6. Q-Q plot of regression residuals against normal distribution.',
  'autocorrelation.png':     'Figure 7. Autocorrelation function (ACF) of CO₂ time series.',
  'rolling_corr.png':        'Figure 8. Rolling 12-month Pearson correlation between CO₂ and temperature.',
  'scatter.png':             'Figure 9. Scatter plot of CO₂ concentration vs. temperature anomaly with OLS fit.',
};

function truncate(name: string, max = 11) {
  const base = name.replace('.png', '');
  return base.length > max ? base.slice(0, max - 1) + '…' : base;
}

function PlotImage({
  name,
  isFirst,
  backendProjectId,
}: {
  name: string;
  isFirst: boolean;
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

  return isFirst ? <Co2TempChart /> : <PlaceholderChart name={name} />;
}

export function PlotLightbox({ plots, currentIndex, onClose, onNavigate, backendProjectId }: PlotLightboxProps) {
  const current = plots[currentIndex] ?? plots[0];
  const caption = PLOT_CAPTIONS[current] ?? `Figure ${currentIndex + 1}.`;

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
              isFirst={currentIndex === 0}
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
