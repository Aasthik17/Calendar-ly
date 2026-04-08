'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { ViewMonth, NavDirection, CalendarDate } from '@/types/calendar';
import { getCurrentViewMonth, addMonths, MONTH_NAMES_FULL, formatDateLabel, countDaysInRange } from '@/utils/dateHelpers';
import { HERO_IMAGES } from '@/data/heroImages';
import { useCalendarDays } from '@/hooks/useCalendarDays';
import { useRangeSelection } from '@/hooks/useRangeSelection';
import { useNotes } from '@/hooks/useNotes';
import { useDominantColor } from '@/hooks/useDominantColor';
import HeroPanel from './HeroPanel';
import CalendarGrid from './CalendarGrid';
import NotesPanel from './NotesPanel';
import styles from './CalendarRoot.module.css';

export default function CalendarRoot() {
  const [viewMonth, setViewMonth] = useState<ViewMonth>(getCurrentViewMonth);
  const [navDirection, setNavDirection] = useState<NavDirection>(null);
  const navQueueRef = useRef<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const {
    selection,
    onCellClick,
    onCellPointerDown,
    onCellPointerEnter,
    onCellPointerUp,
    clearSelection,
  } = useRangeSelection();

  const {
    getNoteForMonth,
    getNoteForRange,
    setNote,
    saveImmediately,
    hasNote,
    savedKey,
  } = useNotes();

  // Hero image for current month
  const heroImage = HERO_IMAGES[viewMonth.month] || HERO_IMAGES[1];

  // Dominant color extraction
  const dominantColor = useDominantColor(heroImage.url);

  // Apply dominant color as accent override
  useEffect(() => {
    if (dominantColor && containerRef.current) {
      containerRef.current.style.setProperty('--color-accent', dominantColor);
    } else if (containerRef.current) {
      containerRef.current.style.removeProperty('--color-accent');
    }
  }, [dominantColor]);

  // Compute calendar days
  const days = useCalendarDays(viewMonth, selection, hasNote);

  // Live region announcement
  const [announcement, setAnnouncement] = useState('');

  // Announce selection changes
  useEffect(() => {
    if (selection.phase === 'start_set' && selection.start && !selection.isDragging) {
      const label = formatDateLabel(selection.start);
      setAnnouncement(`Start date set. ${label}. Now select an end date.`);
    } else if (selection.phase === 'range_set' && selection.start && selection.end) {
      const startLabel = formatDateLabel(selection.start);
      const endLabel = formatDateLabel(selection.end);
      const days = countDaysInRange(selection.start, selection.end);
      setAnnouncement(`Range selected. ${startLabel} to ${endLabel}. ${days} days.`);
    } else if (selection.phase === 'idle') {
      // Only announce clear if there was a previous selection
      setAnnouncement('Selection cleared.');
    }
  }, [selection.phase, selection.start, selection.end, selection.isDragging]);

  // Month navigation
  const navigateMonth = useCallback((direction: 'prev' | 'next') => {
    if (navQueueRef.current) return; // Debounce rapid clicks
    navQueueRef.current = true;

    setNavDirection(direction);
    setViewMonth(prev => addMonths(prev, direction === 'next' ? 1 : -1));

    setTimeout(() => {
      navQueueRef.current = false;
    }, 300);
  }, []);

  const handlePrevMonth = useCallback(() => navigateMonth('prev'), [navigateMonth]);
  const handleNextMonth = useCallback(() => navigateMonth('next'), [navigateMonth]);

  const handleToday = useCallback(() => {
    const current = getCurrentViewMonth();
    if (current.year === viewMonth.year && current.month === viewMonth.month) return;

    const direction = (current.year * 12 + current.month) > (viewMonth.year * 12 + viewMonth.month)
      ? 'next' : 'prev';
    setNavDirection(direction);
    setViewMonth(current);
  }, [viewMonth]);

  // Handle navigating to an other-month date
  const handleNavigateToDate = useCallback((date: CalendarDate) => {
    const direction = (date.year * 12 + date.month) > (viewMonth.year * 12 + viewMonth.month)
      ? 'next' : 'prev';
    setNavDirection(direction as NavDirection);
    setViewMonth({ year: date.year, month: date.month });
    // Set as selection start
    onCellClick(date);
  }, [viewMonth, onCellClick]);

  // Global keyboard handler for month navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only if focus is within the calendar component
      if (!containerRef.current?.contains(document.activeElement) &&
          document.activeElement !== document.body) {
        return;
      }

      // Don't intercept if focus is on a textarea
      if (document.activeElement?.tagName === 'TEXTAREA') return;

      // Don't intercept if focus is on a date cell (grid handles its own arrows)
      if (document.activeElement?.hasAttribute('data-date')) return;

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrevMonth();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNextMonth();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        clearSelection();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePrevMonth, handleNextMonth, clearSelection]);

  // Global pointerup for drag edge case (pointer leaves grid)
  useEffect(() => {
    const handlePointerUp = () => {
      if (selection.isDragging) {
        onCellPointerUp();
      }
    };

    document.addEventListener('pointerup', handlePointerUp);
    return () => document.removeEventListener('pointerup', handlePointerUp);
  }, [selection.isDragging, onCellPointerUp]);

  return (
    <div
      className={styles.root}
      ref={containerRef}
      role="region"
      aria-label="Interactive calendar"
    >
      {/* Hero Image Panel */}
      <HeroPanel
        imageUrl={heroImage.url}
        imageAlt={heroImage.alt}
        monthName={MONTH_NAMES_FULL[viewMonth.month - 1]}
        year={viewMonth.year}
      />

      {/* Right panel: grid + notes */}
      <div className={styles.rightPanel}>
        <CalendarGrid
          days={days}
          viewMonth={viewMonth}
          navDirection={navDirection}
          onPrevMonth={handlePrevMonth}
          onNextMonth={handleNextMonth}
          onToday={handleToday}
          onCellClick={onCellClick}
          onCellPointerDown={onCellPointerDown}
          onCellPointerEnter={onCellPointerEnter}
          onCellPointerUp={onCellPointerUp}
          clearSelection={clearSelection}
          selection={selection}
          onNavigateToDate={handleNavigateToDate}
        />

        <NotesPanel
          viewMonth={viewMonth}
          selection={selection}
          getNoteForMonth={getNoteForMonth}
          getNoteForRange={getNoteForRange}
          setNote={setNote}
          saveImmediately={saveImmediately}
          clearSelection={clearSelection}
          savedKey={savedKey}
        />
      </div>

      {/* Screen reader live region */}
      <div
        className={styles.srOnly}
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {announcement}
      </div>
    </div>
  );
}
