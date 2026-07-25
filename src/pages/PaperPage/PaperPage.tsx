import { Sidebar } from '../../components/organisms/Sidebar/Sidebar';
import styles from './PaperPage.module.css';

// Placeholder destination — scope not built yet, see ROADMAP.md (ties into
// Epic 3's LaTeX manuscript editor work).
export function PaperPage() {
  return (
    <div className={styles.layout}>
      <Sidebar />
      <main className={styles.main}>
        <p className={styles.title}>Paper</p>
        <p className={styles.subtitle}>Coming soon — edit and recompile your manuscript directly.</p>
      </main>
    </div>
  );
}
