import CalendarRoot from '@/components/Calendar/CalendarRoot';
import styles from './page.module.css';

export default function Home() {
  return (
    <main className={styles.main}>
      <header className={styles.masthead} aria-label="Calendarly">
        <div className={styles.brandFrame}>
          <h1 className={styles.brand}>Calendarly</h1>
        </div>
      </header>
      <CalendarRoot />
    </main>
  );
}
