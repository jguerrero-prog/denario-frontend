import { spacing } from '../../../tokens';
import styles from './SpacingScale.module.css';

const steps = Object.entries(spacing) as [string, string][];

interface SpacingStepProps {
  token: string;
  value: string;
}

function SpacingStep({ token, value }: SpacingStepProps) {
  const px = parseInt(value, 10);
  return (
    <div className={styles.step}>
      <span className={styles.tokenName}>space-{token}</span>
      <div
        className={styles.bar}
        style={{ height: px }}
        role="img"
        aria-label={`space-${token}: ${value}`}
      />
      <span className={styles.value}>{value}</span>
    </div>
  );
}

export function SpacingScale() {
  return (
    <div className={styles.scale}>
      {steps.map(([token, value]) => (
        <SpacingStep key={token} token={token} value={value} />
      ))}
    </div>
  );
}
