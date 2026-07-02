import styles from './ColorSwatch.module.css';

interface ColorSwatchProps {
  name: string;
  hex: string;
}

export function ColorSwatch({ name, hex }: ColorSwatchProps) {
  return (
    <div className={styles.swatch}>
      <div className={styles.chip} style={{ backgroundColor: hex }} />
      <div className={styles.label}>
        <span className={styles.name}>{name}</span>
        <span className={styles.hex}>{hex}</span>
      </div>
    </div>
  );
}
