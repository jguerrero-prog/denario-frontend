import styles from './BorderRadius.module.css';

interface RadiusStep {
  token: string;
  value: string;
  isPill?: boolean;
}

const steps: RadiusStep[] = [
  { token: 'radius-sm',   value: '4px' },
  { token: 'radius-md',   value: '8px' },
  { token: 'radius-lg',   value: '12px' },
  { token: 'radius-xl',   value: '16px' },
  { token: 'radius-pill', value: '999', isPill: true },
];

export function BorderRadius() {
  return (
    <div className={styles.row}>
      {steps.map(({ token, value, isPill }) => (
        <div key={token} className={styles.step}>
          <div
            className={isPill ? styles.pill : styles.square}
            style={{ borderRadius: isPill ? '999px' : `var(--${token})` }}
            role="img"
            aria-label={`${token}: ${value}`}
          />
          <div className={styles.label}>
            <span className={styles.name}>{token}</span>
            <span className={styles.value}>{value}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
