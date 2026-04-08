'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { CalendarDate, NotesStore, ViewMonth } from '@/types/calendar';
import { toMonthKey, toRangeKey } from '@/utils/dateHelpers';
import { getSampleNotes } from '@/data/sampleNotes';

const STORAGE_KEY = 'calendar_notes_v1';
const DEBOUNCE_MS = 800;

function loadNotesFromStorage(): NotesStore {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw) as NotesStore;
    }
    // First load — seed with sample notes
    const sample = getSampleNotes(new Date().getFullYear());
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sample));
    return sample;
  } catch {
    // localStorage unavailable or corrupted — fall back to sample notes
    return getSampleNotes(new Date().getFullYear());
  }
}

function saveNotesToStorage(notes: NotesStore): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  } catch {
    // Storage full or unavailable — silently fail
  }
}

export function useNotes() {
  const [notes, setNotes] = useState<NotesStore>({});
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [savedKey, setSavedKey] = useState<string | null>(null);

  useEffect(() => {
    setNotes(loadNotesFromStorage());
  }, []);

  // Persist on changes (debounced)
  const persistNotes = useCallback((updatedNotes: NotesStore) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      saveNotesToStorage(updatedNotes);
    }, DEBOUNCE_MS);
  }, []);

  const setNote = useCallback((key: string, value: string) => {
    setNotes(prev => {
      const updated = { ...prev, [key]: value };
      persistNotes(updated);
      return updated;
    });
  }, [persistNotes]);

  const saveImmediately = useCallback((key: string, value: string) => {
    setNotes(prev => {
      const updated = { ...prev, [key]: value };
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      saveNotesToStorage(updated);
      setSavedKey(key);
      return updated;
    });
  }, []);

  const getNoteForMonth = useCallback((month: ViewMonth): string => {
    const key = toMonthKey(month);
    return notes[key] || '';
  }, [notes]);

  const getNoteForRange = useCallback((start: CalendarDate, end: CalendarDate): string => {
    const key = toRangeKey(start, end);
    return notes[key] || '';
  }, [notes]);

  const hasNote = useCallback((date: CalendarDate): boolean => {
    // Check if any key references this date (as a month key or in a range key)
    const dateStr = `${date.year}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`;
    return Object.entries(notes).some(([key, value]) => {
      if (!value || value.trim() === '') return false;
      if (key.includes(':')) {
        // Range key: "YYYY-MM-DD:YYYY-MM-DD"
        const [startStr, endStr] = key.split(':');
        return dateStr >= startStr && dateStr <= endStr;
      }
      return false;
    });
  }, [notes]);

  // Clear savedKey after 1.5s
  useEffect(() => {
    if (savedKey) {
      const timer = setTimeout(() => setSavedKey(null), 1500);
      return () => clearTimeout(timer);
    }
  }, [savedKey]);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return {
    getNoteForMonth,
    getNoteForRange,
    setNote,
    saveImmediately,
    hasNote,
    savedKey,
  };
}
