import styles from './BorderWidths.module.css';

interface BorderStep {
  token: string;
  width: string;
  color: string;
  description: string;
}

const steps: BorderStep[] = [
  { token: 'border-hairline', width: '0.5px', color: 'var(--color-border-def)',    description: 'Dividers between rows (0.5px)' },
  { token: 'border-default',  width: '1px',   color: 'var(--color-border-def)',    description: 'Default borders (1px)' },
  { token: 'border-card',     width: '1px',   color: 'var(--color-border-card)',   description: 'Card borders (1px)' },
  { token: 'border-accent',   width: '2px',   color: 'var(--color-border-accent)', description: 'Active / accent (2px)' },
  { token: 'border-strong',   width: '2px',   color: 'var(--color-border-str)',    description: 'Green tint borders (2px)' },
];

export function BorderWidths() {
  return (
    <div className={styles.grid}>
      {steps.map(({ token, width, color, description }) => (
        <div key={token} className={styles.step}>
          <span className={styles.token}>{token}</span>
          <div
            className={styles.line}
            style={{ borderTopWidth: width, borderTopColor: color, borderTopStyle: 'solid' }}
            role="img"
            aria-label={`${token}: ${width}`}
          />
          <span className={styles.description}>{description}</span>
        </div>
      ))}
    </div>
  );
}
