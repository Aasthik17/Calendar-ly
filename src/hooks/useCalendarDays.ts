'use client';

import { useMemo } from 'react';
import { CalendarDay, CalendarDate, SelectionState, ViewMonth } from '@/types/calendar';
import {
  getDaysInMonth,
  getFirstDayOfWeek,
  today as getToday,
  isSameDate,
  isBeforeDate,
  isDateInRange,
  sortDates,
} from '@/utils/dateHelpers';

/**
 * Computes the array of CalendarDay objects for the grid.
 * Returns 35 or 42 items (5 or 6 rows × 7 columns).
 * Week starts on Monday.
 */
export function useCalendarDays(
  viewMonth: ViewMonth,
  selection: SelectionState,
  hasNoteForDate: (date: CalendarDate) => boolean
): CalendarDay[] {
  return useMemo(() => {
    const { year, month } = viewMonth;
    const todayDate = getToday();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDayOffset = getFirstDayOfWeek(year, month); // 0=Mon..6=Sun

    // Previous month overflow
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    const daysInPrevMonth = getDaysInMonth(prevYear, prevMonth);

    // Next month
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;

    const days: CalendarDay[] = [];

    // Leading days from previous month
    for (let i = firstDayOffset - 1; i >= 0; i--) {
      const day = daysInPrevMonth - i;
      const date: CalendarDate = { year: prevYear, month: prevMonth, day };
      days.push({
        date,
        cellState: 'other-month',
        isOtherMonth: true,
        hasNote: hasNoteForDate(date),
      });
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const date: CalendarDate = { year, month, day };
      const cellState = deriveCellState(date, todayDate, selection);
      days.push({
        date,
        cellState,
        isOtherMonth: false,
        hasNote: hasNoteForDate(date),
      });
    }

    // Trailing days from next month
    const totalCells = days.length <= 35 ? 35 : 42;
    const trailing = totalCells - days.length;
    for (let day = 1; day <= trailing; day++) {
      const date: CalendarDate = { year: nextYear, month: nextMonth, day };
      days.push({
        date,
        cellState: 'other-month',
        isOtherMonth: true,
        hasNote: hasNoteForDate(date),
      });
    }

    return days;
  }, [viewMonth, selection, hasNoteForDate]);
}

/**
 * Derives the visual cell state for a given date.
 * Priority: range-start-end > range-start > range-end > in-range > in-range-preview > today > disabled > default
 */
function deriveCellState(
  date: CalendarDate,
  todayDate: CalendarDate,
  selection: SelectionState
): CalendarDay['cellState'] {
  const { phase, start, end, previewEnd, isDragging } = selection;

  // Determine the effective start/end for range checking
  let effectiveStart = start;
  let effectiveEnd = end;

  if (phase === 'start_set' && isDragging && previewEnd && start) {
    [effectiveStart, effectiveEnd] = sortDates(start, previewEnd);
  }

  // Check range states (highest priority)
  if (effectiveStart && effectiveEnd) {
    const [s, e] = sortDates(effectiveStart, effectiveEnd);

    if (isSameDate(s, e) && isSameDate(date, s)) {
      return 'range-start-end';
    }
    if (isSameDate(date, s)) {
      return 'range-start';
    }
    if (isSameDate(date, e)) {
      return isDragging ? 'in-range-preview' : 'range-end';
    }
    if (isDateInRange(date, s, e)) {
      return isDragging ? 'in-range-preview' : 'in-range';
    }
  }

  // Single start set (no end yet, no drag preview)
  if (effectiveStart && !effectiveEnd && isSameDate(date, effectiveStart)) {
    return 'range-start';
  }

  // Today
  if (isSameDate(date, todayDate)) {
    return 'today';
  }

  // Past dates (disabled/dimmed but still selectable)
  if (isBeforeDate(date, todayDate)) {
    return 'disabled';
  }

  return 'default';
}
