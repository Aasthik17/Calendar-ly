'use client';

import { useEffect, useRef, useCallback } from 'react';
import { CalendarDay, CalendarDate, NavDirection, ViewMonth, SelectionState } from '@/types/calendar';
import DateCell from './DateCell';
import WeekdayHeaders from './WeekdayHeaders';
import MonthNavigation from './MonthNavigation';
import styles from './CalendarGrid.module.css';

type CalendarGridProps = {
  days: CalendarDay[];
  exitingMonthDays: CalendarDay[];
  viewMonth: ViewMonth;
  exitingMonth: ViewMonth | null;
  navDirection: NavDirection;
  isFlipping: boolean;
  focusDate: CalendarDate | null;
  onFocusDateApplied: () => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
  onCellClick: (date: CalendarDate) => void;
  onCellPointerDown: (date: CalendarDate) => void;
  onCellPointerEnter: (date: CalendarDate) => void;
  onCellPointerUp: () => void;
  clearSelection: () => void;
  selection: SelectionState;
  onNavigateToDate: (date: CalendarDate, shouldSelectStart?: boolean) => void;
  onExitAnimationEnd: () => void;
  onEnterAnimationEnd: () => void;
};

// Extracted inner grid to render both entering and exiting months cleanly
function DateGridCells({
  days,
  selection,
  onCellClick,
  onCellPointerDown,
  onCellPointerEnter,
  onCellPointerUp
}: {
  days: CalendarDay[];
  selection: SelectionState;
  onCellClick: (date: CalendarDate) => void;
  onCellPointerDown: (date: CalendarDate) => void;
  onCellPointerEnter: (date: CalendarDate) => void;
  onCellPointerUp: () => void;
}) {
  return (
    <div
      className={styles.grid}
      data-dragging={selection.isDragging ? 'true' : 'false'}
      role="grid"
      aria-label="Calendar dates"
    >
      {days.map((day) => {
        const key = `${day.date.year}-${day.date.month}-${day.date.day}`;
        return (
          <DateCell
            key={key}
            day={day}
            onClick={onCellClick}
            onPointerDown={onCellPointerDown}
            onPointerEnter={onCellPointerEnter}
            onPointerUp={onCellPointerUp}
          />
        );
      })}
    </div>
  );
}

export default function CalendarGrid({
  days,
  exitingMonthDays,
  viewMonth,
  exitingMonth,
  navDirection,
  isFlipping,
  focusDate,
  onFocusDateApplied,
  onPrevMonth,
  onNextMonth,
  onToday,
  onCellClick,
  onCellPointerDown,
  onCellPointerEnter,
  onCellPointerUp,
  clearSelection,
  selection,
  onNavigateToDate,
  onExitAnimationEnd,
  onEnterAnimationEnd,
}: CalendarGridProps) {
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!focusDate) return;
    if (focusDate.year !== viewMonth.year || focusDate.month !== viewMonth.month) return;

    const dateKey = `${focusDate.year}-${String(focusDate.month).padStart(2, '0')}-${String(focusDate.day).padStart(2, '0')}`;
    const button = gridRef.current?.querySelector<HTMLButtonElement>(`[data-date="${dateKey}"]`);

    if (button) {
      button.focus();
      onFocusDateApplied();
    }
  }, [focusDate, viewMonth, onFocusDateApplied]);

  // Handle clicking an other-month date
  const handleCellClick = useCallback((date: CalendarDate) => {
    const isOtherMonth = date.month !== viewMonth.month || date.year !== viewMonth.year;
    if (isOtherMonth) {
      onNavigateToDate(date, true);
      return;
    }
    onCellClick(date);
  }, [viewMonth, onCellClick, onNavigateToDate]);

  const handleCellPointerDown = useCallback((date: CalendarDate) => {
    const isOtherMonth = date.month !== viewMonth.month || date.year !== viewMonth.year;
    if (isOtherMonth) return;
    onCellPointerDown(date);
  }, [viewMonth, onCellPointerDown]);

  // Keyboard navigation within the grid
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const target = e.target as HTMLElement;
    if (!target.hasAttribute('data-date')) return;

    // Search within the entering layer only to avoid jumping to the ghost layer
    const enteringLayer = gridRef.current?.querySelector(`.${styles['gridLayer--entering']}`);
    const cells = enteringLayer?.querySelectorAll('[data-date]');
    if (!cells) return;

    const cellArray = Array.from(cells) as HTMLButtonElement[];
    const currentIndex = cellArray.indexOf(target as HTMLButtonElement);
    if (currentIndex === -1) return;

    let newIndex = currentIndex;

    switch (e.key) {
      case 'ArrowRight':
        e.preventDefault();
        newIndex = Math.min(currentIndex + 1, cellArray.length - 1);
        break;
      case 'ArrowLeft':
        e.preventDefault();
        newIndex = Math.max(currentIndex - 0, 0);
        newIndex = Math.max(currentIndex - 1, 0);
        break;
      case 'ArrowDown':
        e.preventDefault();
        newIndex = Math.min(currentIndex + 7, cellArray.length - 1);
        break;
      case 'ArrowUp':
        e.preventDefault();
        newIndex = Math.max(currentIndex - 7, 0);
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        (target as HTMLButtonElement).click();
        return;
      case 'Escape':
        e.preventDefault();
        clearSelection();
        return;
      default:
        return;
    }

    if (newIndex !== currentIndex) {
      const nextDate = days[newIndex]?.date;

      if (nextDate && (nextDate.month !== viewMonth.month || nextDate.year !== viewMonth.year)) {
        onNavigateToDate(nextDate, false);
      } else {
        cellArray[newIndex].focus();
      }
    }
  }, [clearSelection, days, viewMonth, onNavigateToDate]);

  const noop = () => {};
  const flipClass = navDirection === 'next' ? 'flipNext' : 'flipPrev';

  return (
    <div className={styles.gridWrapper}>
      <MonthNavigation
        viewMonth={viewMonth}
        onPrev={onPrevMonth}
        onNext={onNextMonth}
        onToday={onToday}
        isFlipping={isFlipping}
      />
      <div
        className={styles.flipViewport}
        ref={gridRef}
        onKeyDown={handleKeyDown}
        onPointerUp={onCellPointerUp}
      >
        <div className={styles.flipContainer}>
          {exitingMonth && (
            <div
              className={`
                ${styles.gridLayer}
                ${styles['gridLayer--exiting']}
                ${styles[`${flipClass}-exit`]}
              `}
              onAnimationEnd={onExitAnimationEnd}
              aria-hidden="true"
            >
              <WeekdayHeaders />
              <DateGridCells
                days={exitingMonthDays}
                selection={selection}
                onCellClick={noop}
                onCellPointerDown={noop}
                onCellPointerEnter={noop}
                onCellPointerUp={noop}
              />
            </div>
          )}

          <div
            className={`
              ${styles.gridLayer}
              ${styles['gridLayer--entering']}
              ${isFlipping ? styles[`${flipClass}-enter`] : ''}
            `}
            onAnimationEnd={isFlipping ? onEnterAnimationEnd : undefined}
          >
            <WeekdayHeaders />
            <DateGridCells
              days={days}
              selection={selection}
              onCellClick={handleCellClick}
              onCellPointerDown={handleCellPointerDown}
              onCellPointerEnter={onCellPointerEnter}
              onCellPointerUp={onCellPointerUp}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
