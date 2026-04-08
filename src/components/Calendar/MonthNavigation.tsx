'use client';

import { ViewMonth } from '@/types/calendar';
import { MONTH_NAMES_FULL, getCurrentViewMonth } from '@/utils/dateHelpers';
import styles from './MonthNavigation.module.css';

type MonthNavigationProps = {
  viewMonth: ViewMonth;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  isFlipping?: boolean;
};

export default function MonthNavigation({ viewMonth, onPrev, onNext, onToday, isFlipping = false }: MonthNavigationProps) {
  const current = getCurrentViewMonth();
  const isCurrentMonth = viewMonth.year === current.year && viewMonth.month === current.month;

  const prevMonth = viewMonth.month === 1
    ? { m: MONTH_NAMES_FULL[11], y: viewMonth.year - 1 }
    : { m: MONTH_NAMES_FULL[viewMonth.month - 2], y: viewMonth.year };

  const nextMonth = viewMonth.month === 12
    ? { m: MONTH_NAMES_FULL[0], y: viewMonth.year + 1 }
    : { m: MONTH_NAMES_FULL[viewMonth.month], y: viewMonth.year };

  return (
    <nav className={styles.nav} aria-label="Month navigation">
      <div className={styles.controls}>
        <button
          className={`${styles.arrowBtn} ${isFlipping ? styles.navArrowDisabled : ''}`}
          onClick={onPrev}
          aria-label={`Go to ${prevMonth.m} ${prevMonth.y}`}
          type="button"
        >
          ‹
        </button>
      </div>

      <div className={styles.monthYear}>
        <span className={styles.monthName}>
          {MONTH_NAMES_FULL[viewMonth.month - 1]}
        </span>
        <span className={styles.year}>{viewMonth.year}</span>
      </div>

      <div className={styles.controls}>
        <button
          className={`${styles.todayChip} ${isCurrentMonth ? styles.todayChipHidden : ''}`}
          onClick={onToday}
          aria-label={`Return to ${MONTH_NAMES_FULL[current.month - 1]} ${current.year}`}
          type="button"
          tabIndex={isCurrentMonth ? -1 : 0}
        >
          Today
        </button>
        <button
          className={`${styles.arrowBtn} ${isFlipping ? styles.navArrowDisabled : ''}`}
          onClick={onNext}
          aria-label={`Go to ${nextMonth.m} ${nextMonth.y}`}
          type="button"
        >
          ›
        </button>
      </div>
    </nav>
  );
}
