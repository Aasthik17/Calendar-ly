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
  const [heroMonth, setHeroMonth] = useState<ViewMonth>(getCurrentViewMonth);
  const [navDirection, setNavDirection] = useState<NavDirection>(null);
  const [focusDate, setFocusDate] = useState<CalendarDate | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const navTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const queuedDirectionRef = useRef<NavDirection>(null);
  const isNavigatingRef = useRef(false);
  const viewMonthRef = useRef(viewMonth);

  const {
    selection,
    onCellClick,
    onCellPointerDown,
    onCellPointerEnter,
    onCellPointerUp,
    clearSelection,
    setSelectionStart,
  } = useRangeSelection();
  const previousPhaseRef = useRef(selection.phase);

  const {
    getNoteForMonth,
    getNoteForRange,
    setNote,
    saveImmediately,
    hasNote,
    savedKey,
  } = useNotes();

  useEffect(() => {
    viewMonthRef.current = viewMonth;
  }, [viewMonth]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setHeroMonth(viewMonth);
    }, 300);

    return () => window.clearTimeout(timer);
  }, [viewMonth]);

  // Hero image for current month
  const heroImage = HERO_IMAGES[heroMonth.month] || HERO_IMAGES[1];

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
    const previousPhase = previousPhaseRef.current;

    if (selection.phase === 'start_set' && selection.start && !selection.isDragging) {
      const label = formatDateLabel(selection.start);
      setAnnouncement(`Start date set. ${label}. Now select an end date.`);
    } else if (selection.phase === 'range_set' && selection.start && selection.end) {
      const startLabel = formatDateLabel(selection.start);
      const endLabel = formatDateLabel(selection.end);
      const days = countDaysInRange(selection.start, selection.end);
      setAnnouncement(`Range selected. ${startLabel} to ${endLabel}. ${days} days.`);
    } else if (selection.phase === 'idle' && previousPhase !== 'idle') {
      setAnnouncement('Selection cleared.');
    }

    previousPhaseRef.current = selection.phase;
  }, [selection.phase, selection.start, selection.end, selection.isDragging]);

  const stopNavigationQueue = useCallback(() => {
    isNavigatingRef.current = false;
    queuedDirectionRef.current = null;

    if (navTimerRef.current) {
      clearTimeout(navTimerRef.current);
      navTimerRef.current = null;
    }
  }, []);

  const startNavigation = useCallback((direction: 'prev' | 'next') => {
    const nextMonth = addMonths(viewMonthRef.current, direction === 'next' ? 1 : -1);

    viewMonthRef.current = nextMonth;
    isNavigatingRef.current = true;
    setNavDirection(direction);
    setViewMonth(nextMonth);
    setFocusDate({ year: nextMonth.year, month: nextMonth.month, day: 1 });

    if (navTimerRef.current) {
      clearTimeout(navTimerRef.current);
    }

    navTimerRef.current = setTimeout(() => {
      const queuedDirection = queuedDirectionRef.current;
      queuedDirectionRef.current = null;

      if (queuedDirection) {
        startNavigation(queuedDirection);
        return;
      }

      isNavigatingRef.current = false;
      setNavDirection(null);
      navTimerRef.current = null;
    }, 300);
  }, []);

  // Month navigation
  const navigateMonth = useCallback((direction: 'prev' | 'next') => {
    if (isNavigatingRef.current) {
      if (!queuedDirectionRef.current) {
        queuedDirectionRef.current = direction;
      }
      return;
    }

    startNavigation(direction);
  }, [startNavigation]);

  const handlePrevMonth = useCallback(() => navigateMonth('prev'), [navigateMonth]);
  const handleNextMonth = useCallback(() => navigateMonth('next'), [navigateMonth]);

  const handleToday = useCallback(() => {
    const current = getCurrentViewMonth();
    const activeViewMonth = viewMonthRef.current;

    if (current.year === activeViewMonth.year && current.month === activeViewMonth.month) return;

    stopNavigationQueue();

    const direction = (current.year * 12 + current.month) > (activeViewMonth.year * 12 + activeViewMonth.month)
      ? 'next' : 'prev';

    setNavDirection(direction);
    setViewMonth(current);
    viewMonthRef.current = current;
    setFocusDate({ year: current.year, month: current.month, day: 1 });
    navTimerRef.current = setTimeout(() => {
      setNavDirection(null);
      navTimerRef.current = null;
    }, 300);
  }, [stopNavigationQueue]);

  const handleNavigateToDate = useCallback((date: CalendarDate, shouldSelectStart = true) => {
    const activeViewMonth = viewMonthRef.current;
    const targetMonth = { year: date.year, month: date.month };

    if (shouldSelectStart) {
      setSelectionStart(date);
    }

    if (targetMonth.year === activeViewMonth.year && targetMonth.month === activeViewMonth.month) {
      setFocusDate(date);
      return;
    }

    stopNavigationQueue();

    const direction = (date.year * 12 + date.month) > (activeViewMonth.year * 12 + activeViewMonth.month)
      ? 'next' : 'prev';

    setNavDirection(direction as NavDirection);
    setViewMonth(targetMonth);
    viewMonthRef.current = targetMonth;
    setFocusDate(date);
    navTimerRef.current = setTimeout(() => {
      setNavDirection(null);
      navTimerRef.current = null;
    }, 300);
  }, [setSelectionStart, stopNavigationQueue]);

  const handleFocusDateApplied = useCallback(() => {
    setFocusDate(null);
  }, []);

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

  useEffect(() => {
    return () => {
      stopNavigationQueue();
    };
  }, [stopNavigationQueue]);

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
        monthName={MONTH_NAMES_FULL[heroMonth.month - 1]}
        year={heroMonth.year}
      />

      {/* Right panel: grid + notes */}
      <div className={styles.rightPanel}>
        <CalendarGrid
          days={days}
          viewMonth={viewMonth}
          navDirection={navDirection}
          focusDate={focusDate}
          onFocusDateApplied={handleFocusDateApplied}
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
