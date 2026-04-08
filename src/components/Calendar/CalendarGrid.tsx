'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { CalendarDay, CalendarDate, NavDirection, ViewMonth, SelectionState } from '@/types/calendar';
import DateCell from './DateCell';
import WeekdayHeaders from './WeekdayHeaders';
import MonthNavigation from './MonthNavigation';
import styles from './CalendarGrid.module.css';

type CalendarGridProps = {
  days: CalendarDay[];
  viewMonth: ViewMonth;
  navDirection: NavDirection;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
  onCellClick: (date: CalendarDate) => void;
  onCellPointerDown: (date: CalendarDate) => void;
  onCellPointerEnter: (date: CalendarDate) => void;
  onCellPointerUp: () => void;
  clearSelection: () => void;
  selection: SelectionState;
  onNavigateToDate: (date: CalendarDate) => void;
};

export default function CalendarGrid({
  days,
  viewMonth,
  navDirection,
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
}: CalendarGridProps) {
  const [animClass, setAnimClass] = useState('');
  const gridRef = useRef<HTMLDivElement>(null);
  const focusIndexRef = useRef<number>(-1);

  // Month transition animation
  useEffect(() => {
    if (!navDirection) return;

    const inClass = navDirection === 'next' ? styles.slideInRight : styles.slideInLeft;
    setAnimClass(inClass);

    const timer = setTimeout(() => {
      setAnimClass('');
    }, 300);

    return () => clearTimeout(timer);
  }, [navDirection, viewMonth]);

  // Handle clicking an other-month date
  const handleCellClick = useCallback((date: CalendarDate) => {
    const isOtherMonth = date.month !== viewMonth.month || date.year !== viewMonth.year;
    if (isOtherMonth) {
      onNavigateToDate(date);
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

    const cells = gridRef.current?.querySelectorAll('[data-date]');
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
      cellArray[newIndex].focus();
      focusIndexRef.current = newIndex;

      // Check if focus moved to an other-month cell
      const dateAttr = cellArray[newIndex].getAttribute('data-date');
      if (dateAttr) {
        const [y, m] = dateAttr.split('-').map(Number);
        if (m !== viewMonth.month || y !== viewMonth.year) {
          // Navigate to that month
          const date: CalendarDate = {
            year: y,
            month: m,
            day: parseInt(dateAttr.split('-')[2]),
          };
          onNavigateToDate(date);
        }
      }
    }
  }, [clearSelection, viewMonth, onNavigateToDate]);

  return (
    <div className={styles.gridWrapper}>
      <MonthNavigation
        viewMonth={viewMonth}
        onPrev={onPrevMonth}
        onNext={onNextMonth}
        onToday={onToday}
      />
      <WeekdayHeaders />
      <div
        className={styles.gridTransition}
        ref={gridRef}
        onKeyDown={handleKeyDown}
        onPointerUp={onCellPointerUp}
      >
        <div
          className={`${styles.grid} ${animClass} ${selection.isDragging ? 'dragActive' : ''}`}
          role="grid"
          aria-label="Calendar dates"
        >
          {days.map((day) => {
            const key = `${day.date.year}-${day.date.month}-${day.date.day}`;
            return (
              <DateCell
                key={key}
                day={day}
                onClick={handleCellClick}
                onPointerDown={handleCellPointerDown}
                onPointerEnter={onCellPointerEnter}
                onPointerUp={onCellPointerUp}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
