import styles from './WeekdayHeaders.module.css';

const WEEKDAYS_SHORT = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
const WEEKDAYS_FULL = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function WeekdayHeaders() {
  return (
    <div className={styles.headers} role="row">
      {WEEKDAYS_SHORT.map((day, i) => (
        <div
          key={day}
          className={styles.header}
          role="columnheader"
          aria-label={WEEKDAYS_FULL[i]}
        >
          {day}
        </div>
      ))}
    </div>
  );
}
