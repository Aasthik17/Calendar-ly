'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { ViewMonth, SelectionState, CalendarDate } from '@/types/calendar';
import {
  MONTH_NAMES_FULL,
  MONTH_NAMES_SHORT,
  toMonthKey,
  toRangeKey,
  formatRangeSummary,
  countDaysInRange,
} from '@/utils/dateHelpers';
import styles from './NotesPanel.module.css';

const MONTH_NOTE_MAX = 500;
const RANGE_NOTE_MAX = 280;
const COUNTER_THRESHOLD = 40;

type NotesPanelProps = {
  viewMonth: ViewMonth;
  selection: SelectionState;
  getNoteForMonth: (month: ViewMonth) => string;
  getNoteForRange: (start: CalendarDate, end: CalendarDate) => string;
  setNote: (key: string, value: string) => void;
  saveImmediately: (key: string, value: string) => void;
  clearSelection: () => void;
  savedKey: string | null;
};

export default function NotesPanel({
  viewMonth,
  selection,
  getNoteForMonth,
  getNoteForRange,
  setNote,
  saveImmediately,
  clearSelection,
  savedKey,
}: NotesPanelProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const monthTextareaRef = useRef<HTMLTextAreaElement>(null);
  const rangeTextareaRef = useRef<HTMLTextAreaElement>(null);

  const monthKey = toMonthKey(viewMonth);
  const monthNote = getNoteForMonth(viewMonth);
  const monthName = MONTH_NAMES_FULL[viewMonth.month - 1];
  const hasRange = selection.phase === 'range_set' && selection.start && selection.end;

  const rangeKey = hasRange ? toRangeKey(selection.start!, selection.end!) : '';
  const rangeNote = hasRange ? getNoteForRange(selection.start!, selection.end!) : '';
  const rangeSummary = hasRange ? formatRangeSummary(selection.start!, selection.end!) : '';
  const rangeDays = hasRange ? countDaysInRange(selection.start!, selection.end!) : 0;

  // Autogrow textarea
  const autoGrow = useCallback((el: HTMLTextAreaElement | null) => {
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
  }, []);

  useEffect(() => {
    autoGrow(monthTextareaRef.current);
  }, [monthNote, autoGrow]);

  useEffect(() => {
    autoGrow(rangeTextareaRef.current);
  }, [rangeNote, autoGrow]);

  const handleMonthChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (value.length > MONTH_NOTE_MAX) return;
    setNote(monthKey, value);
    autoGrow(e.target);
  };

  const handleMonthBlur = () => {
    saveImmediately(monthKey, monthNote);
  };

  const handleRangeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (value.length > RANGE_NOTE_MAX) return;
    setNote(rangeKey, value);
    autoGrow(e.target);
  };

  const handleRangeBlur = () => {
    if (hasRange) {
      saveImmediately(rangeKey, rangeNote);
    }
  };

  // Character counter logic
  const monthRemaining = MONTH_NOTE_MAX - monthNote.length;
  const showMonthCounter = monthRemaining <= COUNTER_THRESHOLD;
  const monthCounterClass = getCounterClass(monthRemaining);

  const rangeRemaining = RANGE_NOTE_MAX - rangeNote.length;
  const showRangeCounter = rangeRemaining <= COUNTER_THRESHOLD;
  const rangeCounterClass = getCounterClass(rangeRemaining);

  // Drawer label
  const drawerLabel = hasRange
    ? `${MONTH_NAMES_SHORT[selection.start!.month - 1]} ${selection.start!.day} – ${MONTH_NAMES_SHORT[selection.end!.month - 1]} ${selection.end!.day}`
    : monthNote ? `Notes for ${monthName}` : `Add notes for ${monthName}`;

  return (
    <>
      {/* Desktop panel */}
      <div className={styles.panel}>
        {/* Range summary bar */}
        {hasRange && (
          <div className={styles.rangeSummary}>
            <span className={styles.rangeDates}>{rangeSummary}</span>
            <span className={styles.rangeDays}>
              {rangeDays} day{rangeDays !== 1 ? 's' : ''}
            </span>
            <button
              className={styles.clearBtn}
              onClick={clearSelection}
              aria-label="Clear selection"
              type="button"
            >
              ×
            </button>
          </div>
        )}

        {/* Range note */}
        <div className={`${styles.noteSection} ${!hasRange ? styles.noteSectionHidden : ''}`}>
          <div className={styles.noteHeader}>
            <span className={styles.noteLabel}>
              {hasRange
                ? `${MONTH_NAMES_SHORT[selection.start!.month - 1]} ${selection.start!.day} – ${MONTH_NAMES_SHORT[selection.end!.month - 1]} ${selection.end!.day}`
                : ''}
            </span>
            <span className={`${styles.savedIndicator} ${savedKey === rangeKey ? styles.savedIndicatorVisible : ''}`}>
              ✓ Saved
            </span>
          </div>
          <textarea
            ref={rangeTextareaRef}
            className={styles.textarea}
            value={rangeNote}
            onChange={handleRangeChange}
            onBlur={handleRangeBlur}
            placeholder="Notes for this period…"
            maxLength={RANGE_NOTE_MAX}
            aria-label={hasRange ? `Notes for ${rangeSummary}` : 'Range notes'}
          />
          <div className={`${styles.charCounter} ${showRangeCounter ? styles.charCounterVisible : ''} ${rangeCounterClass}`}>
            {rangeRemaining} left
          </div>
        </div>

        {hasRange && <div className={styles.divider} />}

        {/* Month note */}
        <div className={styles.noteSection}>
          <div className={styles.noteHeader}>
            <span className={styles.noteLabel}>
              {monthName} {viewMonth.year}
            </span>
            <span className={`${styles.savedIndicator} ${savedKey === monthKey ? styles.savedIndicatorVisible : ''}`}>
              ✓ Saved
            </span>
          </div>
          <textarea
            ref={monthTextareaRef}
            className={styles.textarea}
            value={monthNote}
            onChange={handleMonthChange}
            onBlur={handleMonthBlur}
            placeholder={`Notes for ${monthName}…`}
            maxLength={MONTH_NOTE_MAX}
            aria-label={`Notes for ${monthName} ${viewMonth.year}`}
          />
          <div className={`${styles.charCounter} ${showMonthCounter ? styles.charCounterVisible : ''} ${monthCounterClass}`}>
            {monthRemaining} left
          </div>
        </div>
      </div>

      {/* Mobile drawer */}
      <div className={`${styles.drawer} ${drawerOpen ? styles.drawerOpen : ''}`}>
        <div className={styles.drawerHandle} />
        <button
          className={styles.drawerToggle}
          onClick={() => setDrawerOpen(!drawerOpen)}
          type="button"
          aria-label={drawerOpen ? 'Close notes' : 'Notes'}
        >
          📝 {drawerOpen ? 'Close notes' : drawerLabel}
        </button>
        {drawerOpen && (
          <div className={styles.drawerContent}>
            {/* Range note in drawer */}
            {hasRange && (
              <>
                <div className={styles.rangeSummary}>
                  <span className={styles.rangeDates}>{rangeSummary}</span>
                  <span className={styles.rangeDays}>
                    {rangeDays} day{rangeDays !== 1 ? 's' : ''}
                  </span>
                  <button
                    className={styles.clearBtn}
                    onClick={clearSelection}
                    aria-label="Clear selection"
                    type="button"
                  >
                    ×
                  </button>
                </div>
                <div className={styles.noteSection} style={{ marginTop: '0.5rem' }}>
                  <span className={styles.noteLabel}>
                    {MONTH_NAMES_SHORT[selection.start!.month - 1]} {selection.start!.day} – {MONTH_NAMES_SHORT[selection.end!.month - 1]} {selection.end!.day}
                  </span>
                  <textarea
                    className={styles.textarea}
                    value={rangeNote}
                    onChange={handleRangeChange}
                    onBlur={handleRangeBlur}
                    placeholder="Notes for this period…"
                    maxLength={RANGE_NOTE_MAX}
                  />
                </div>
                <div className={styles.divider} />
              </>
            )}

            {/* Month note in drawer */}
            <div className={styles.noteSection} style={{ marginTop: hasRange ? '0.5rem' : 0 }}>
              <span className={styles.noteLabel}>
                {monthName} {viewMonth.year}
              </span>
              <textarea
                className={styles.textarea}
                value={monthNote}
                onChange={handleMonthChange}
                onBlur={handleMonthBlur}
                placeholder={`Notes for ${monthName}…`}
                maxLength={MONTH_NOTE_MAX}
              />
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function getCounterClass(remaining: number): string {
  if (remaining <= 5) return styles.charCounterDanger;
  if (remaining <= 20) return styles.charCounterWarning;
  return '';
}
