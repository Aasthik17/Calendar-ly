'use client';

import React from 'react';
import { CalendarDay, CalendarDate } from '@/types/calendar';
import { getDayOfWeek, MONTH_NAMES_FULL } from '@/utils/dateHelpers';
import { getHolidayForDate } from '@/data/holidays';
import styles from './DateCell.module.css';

type DateCellProps = {
  day: CalendarDay;
  onPointerDown: (date: CalendarDate) => void;
  onPointerEnter: (date: CalendarDate) => void;
  onPointerUp: () => void;
  onClick: (date: CalendarDate) => void;
};

const DateCell = React.memo(function DateCell({
  day,
  onPointerDown,
  onPointerEnter,
  onPointerUp,
  onClick,
}: DateCellProps) {
  const { date, cellState, isOtherMonth, hasNote } = day;
  const holiday = getHolidayForDate(date.month, date.day);

  // Build class name based on cell state
  const stateClass = getStateClass(cellState, isOtherMonth);

  // Build aria-label
  const ariaLabel = buildAriaLabel(date, cellState);

  // Determine aria-pressed
  const isPressed = cellState === 'range-start' || cellState === 'range-end' || cellState === 'range-start-end';

  return (
    <button
      className={`${styles.cell} ${stateClass}`}
      role="gridcell"
      aria-label={ariaLabel}
      aria-pressed={isPressed || undefined}
      onPointerDown={(e) => {
        e.preventDefault();
        onPointerDown(date);
      }}
      onPointerEnter={() => onPointerEnter(date)}
      onPointerUp={onPointerUp}
      onClick={() => onClick(date)}
      type="button"
      tabIndex={isOtherMonth ? -1 : 0}
      data-date={`${date.year}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`}
    >
      <span className={styles.number}>{date.day}</span>

      {/* Marker dots */}
      <div className={styles.markers}>
        {holiday && holiday.type === 'public' && (
          <span className={styles.holidayDot} />
        )}
        {holiday && holiday.type === 'observance' && (
          <span className={styles.holidayDotObservance} />
        )}
        {hasNote && (
          <span className={styles.noteDot} />
        )}
      </div>

      {/* Holiday tooltip */}
      {holiday && (
        <span className={styles.tooltip}>{holiday.name}</span>
      )}
    </button>
  );
});

function getStateClass(cellState: CalendarDay['cellState'], isOtherMonth: boolean): string {
  if (isOtherMonth) return styles.cellOtherMonth;

  switch (cellState) {
    case 'today':
      return styles.cellToday;
    case 'range-start':
      return styles.cellRangeStart;
    case 'range-end':
      return styles.cellRangeEnd;
    case 'range-start-end':
      return styles.cellRangeStartEnd;
    case 'in-range':
      return styles.cellInRange;
    case 'in-range-preview':
      return styles.cellInRangePreview;
    case 'disabled':
      return styles.cellDisabled;
    default:
      return '';
  }
}

function buildAriaLabel(date: CalendarDate, cellState: CalendarDay['cellState']): string {
  const dayOfWeek = getDayOfWeek(date);
  const monthName = MONTH_NAMES_FULL[date.month - 1];
  const base = `${dayOfWeek}, ${monthName} ${date.day}, ${date.year}`;

  switch (cellState) {
    case 'today':
      return `Today, ${base}`;
    case 'range-start':
    case 'range-start-end':
      return `${base}, start of selected range`;
    case 'in-range':
    case 'in-range-preview':
      return `${base}, within selected range`;
    case 'range-end':
      return `${base}, end of selected range`;
    default:
      return base;
  }
}

export default DateCell;
