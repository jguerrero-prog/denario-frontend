import { Sidebar } from '../../components/organisms/Sidebar/Sidebar';
import styles from './LabPage.module.css';

// Placeholder destination — scope not built yet, see ROADMAP.md (ties into
// Epic 4's interactive data-visualization work).
export function LabPage() {
  return (
    <div className={styles.layout}>
      <Sidebar />
      <main className={styles.main}>
        <p className={styles.title}>Lab</p>
        <p className={styles.subtitle}>Coming soon — a dedicated space for exploring your analysis&apos;s data and plots.</p>
      </main>
    </div>
  );
}
