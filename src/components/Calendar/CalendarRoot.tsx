'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { ViewMonth, NavDirection, CalendarDate, SelectionState } from '@/types/calendar';
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

const emptySelection: SelectionState = { phase: 'idle', start: null, end: null, previewEnd: null, isDragging: false };

export default function CalendarRoot() {
  const [viewMonth, setViewMonth] = useState<ViewMonth>(getCurrentViewMonth);
  const [heroMonth, setHeroMonth] = useState<ViewMonth>(getCurrentViewMonth);
  const [navDirection, setNavDirection] = useState<NavDirection>(null);
  const [focusDate, setFocusDate] = useState<CalendarDate | null>(null);
  
  // Dual-buffer flip state
  const [exitingMonth, setExitingMonth] = useState<ViewMonth | null>(null);
  const [isFlipping, setIsFlipping] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const viewMonthRef = useRef(viewMonth); // For global keyboard handlers

  const prefersReducedMotion = typeof window !== 'undefined'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

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

  // Delayed hero image loading
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setHeroMonth(viewMonth);
    }, 300); // Intentionally kept at 300ms so it trails the grid rotation slightly
    return () => window.clearTimeout(timer);
  }, [viewMonth]);

  // Visuals computation
  const heroImage = HERO_IMAGES[heroMonth.month] || HERO_IMAGES[1];
  const dominantColor = useDominantColor(heroImage.url);

  useEffect(() => {
    if (dominantColor && containerRef.current) {
      containerRef.current.style.setProperty('--color-accent', dominantColor);
    } else if (containerRef.current) {
      containerRef.current.style.removeProperty('--color-accent');
    }
  }, [dominantColor]);

  // Dual-buffer days computation
  const days = useCalendarDays(viewMonth, selection, hasNote);
  const exitingMonthDays = useCalendarDays(exitingMonth ?? viewMonth, emptySelection, hasNote);

  // Live region announcement
  const [announcement, setAnnouncement] = useState('');

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

  // Flip orchestration
  const triggerFlipNavigation = useCallback((newMonth: ViewMonth, direction: NavDirection) => {
    if (isFlipping) return;

    setExitingMonth(viewMonth);
    setNavDirection(direction);
    setIsFlipping(true);
    setViewMonth(newMonth);

    if (prefersReducedMotion) {
      setTimeout(() => {
        setExitingMonth(null);
        setIsFlipping(false);
        setNavDirection(null);
      }, 130);
    }
  }, [viewMonth, isFlipping, prefersReducedMotion]);

  const handleExitAnimationEnd = useCallback(() => {
    setExitingMonth(null);
    setIsFlipping(false);
  }, []);

  const handleEnterAnimationEnd = useCallback(() => {
    setNavDirection(null);
  }, []);

  const handlePrevMonth = useCallback(() => {
    triggerFlipNavigation(addMonths(viewMonth, -1), 'prev');
  }, [viewMonth, triggerFlipNavigation]);

  const handleNextMonth = useCallback(() => {
    triggerFlipNavigation(addMonths(viewMonth, 1), 'next');
  }, [viewMonth, triggerFlipNavigation]);

  const handleToday = useCallback(() => {
    const current = getCurrentViewMonth();
    if (current.year === viewMonth.year && current.month === viewMonth.month) return;
    const direction = (current.year * 12 + current.month) > (viewMonth.year * 12 + viewMonth.month) ? 'next' : 'prev';
    setFocusDate({ year: current.year, month: current.month, day: 1 });
    triggerFlipNavigation(current, direction);
  }, [viewMonth, triggerFlipNavigation]);

  const handleNavigateToDate = useCallback((date: CalendarDate, shouldSelectStart = true) => {
    const targetMonth = { year: date.year, month: date.month };
    if (shouldSelectStart) setSelectionStart(date);

    if (targetMonth.year === viewMonth.year && targetMonth.month === viewMonth.month) {
      setFocusDate(date);
      return;
    }
    const direction = (date.year * 12 + date.month) > (viewMonth.year * 12 + viewMonth.month) ? 'next' : 'prev';
    setFocusDate(date);
    triggerFlipNavigation(targetMonth, direction);
  }, [viewMonth, setSelectionStart, triggerFlipNavigation]);

  const handleFocusDateApplied = useCallback(() => setFocusDate(null), []);

  // Global keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!containerRef.current?.contains(document.activeElement) && document.activeElement !== document.body) return;
      if (document.activeElement?.tagName === 'TEXTAREA') return;
      if (document.activeElement?.hasAttribute('data-date')) return;

      if (e.key === 'ArrowLeft') { e.preventDefault(); handlePrevMonth(); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); handleNextMonth(); }
      else if (e.key === 'Escape') { e.preventDefault(); clearSelection(); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePrevMonth, handleNextMonth, clearSelection]);

  // Global pointerup for drag edge case
  useEffect(() => {
    const handlePointerUp = () => { if (selection.isDragging) onCellPointerUp(); };
    document.addEventListener('pointerup', handlePointerUp);
    return () => document.removeEventListener('pointerup', handlePointerUp);
  }, [selection.isDragging, onCellPointerUp]);

  return (
    <div className={styles.root} ref={containerRef} role="region" aria-label="Interactive calendar">
      <HeroPanel
        imageUrl={heroImage.url}
        imageAlt={heroImage.alt}
        monthName={MONTH_NAMES_FULL[heroMonth.month - 1]}
        year={heroMonth.year}
      />
      <div className={styles.rightPanel}>
        <CalendarGrid
          days={days}
          exitingMonthDays={exitingMonthDays}
          viewMonth={viewMonth}
          exitingMonth={exitingMonth}
          navDirection={navDirection}
          isFlipping={isFlipping}
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
          onExitAnimationEnd={handleExitAnimationEnd}
          onEnterAnimationEnd={handleEnterAnimationEnd}
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
      <div className={styles.srOnly} role="status" aria-live="polite" aria-atomic="true">
        {announcement}
      </div>
    </div>
  );
}
