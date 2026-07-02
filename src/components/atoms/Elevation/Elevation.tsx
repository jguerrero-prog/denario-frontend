import styles from './Elevation.module.css';

interface ElevationStep {
  token: string;
  label: string;
  className: string;
}

const steps: ElevationStep[] = [
  { token: 'flat',     label: 'Flat · Border only',     className: styles.flat },
  { token: 'raised',   label: 'Raised · Subtle shadow',  className: styles.raised },
  { token: 'floating', label: 'Floating · Manuscript',   className: styles.floating },
];

export function Elevation() {
  return (
    <div className={styles.row}>
      {steps.map(({ token, label, className }) => (
        <div key={token} className={styles.step}>
          <div
            className={className}
            role="img"
            aria-label={token}
          />
          <span className={styles.label}>{label}</span>
        </div>
      ))}
    </div>
  );
}
