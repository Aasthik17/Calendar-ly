'use client';

import { useReducer, useCallback, useRef } from 'react';
import { CalendarDate, SelectionState } from '@/types/calendar';
import { isSameDate, sortDates } from '@/utils/dateHelpers';

export const initialSelectionState: SelectionState = {
  phase: 'idle',
  start: null,
  end: null,
  previewEnd: null,
  isDragging: false,
};

type SelectionAction =
  | { type: 'CLICK'; date: CalendarDate }
  | { type: 'DRAG_START'; date: CalendarDate }
  | { type: 'DRAG_MOVE'; date: CalendarDate }
  | { type: 'DRAG_END' }
  | { type: 'SET_START'; date: CalendarDate }
  | { type: 'CLEAR' };

function selectionReducer(state: SelectionState, action: SelectionAction): SelectionState {
  switch (action.type) {
    case 'CLICK':
      // If we were dragging, DRAG_END already handled the state — skip the click
      if (state.isDragging) return state;

      if (state.phase === 'idle') {
        return { ...state, phase: 'start_set', start: action.date, end: null, previewEnd: null };
      }
      if (state.phase === 'start_set') {
        if (state.start && isSameDate(state.start, action.date)) {
          // Clicking the start date again clears the selection
          return initialSelectionState;
        }
        // Complete the range, auto-swapping if necessary
        const [start, end] = sortDates(state.start!, action.date);
        return { ...state, phase: 'range_set', start, end, previewEnd: null };
      }
      if (state.phase === 'range_set') {
        // Clicking while a range is set resets to a new start
        return { ...initialSelectionState, phase: 'start_set', start: action.date };
      }
      return state;

    case 'DRAG_START':
      // Start tracking a potential drag — don't reset click state machine yet
      return { ...initialSelectionState, phase: 'start_set', start: action.date, isDragging: true };

    case 'DRAG_MOVE':
      if (!state.isDragging || !state.start) return state;
      return { ...state, previewEnd: action.date };

    case 'DRAG_END': {
      if (!state.isDragging) return state;
      if (!state.previewEnd || (state.start && isSameDate(state.start, state.previewEnd))) {
        // Drag ended without moving (or on same cell) — just turn off dragging,
        // don't change phase so click handler can process this
        return { ...state, isDragging: false, previewEnd: null };
      }
      const [start, end] = sortDates(state.start!, state.previewEnd);
      return { phase: 'range_set', start, end, previewEnd: null, isDragging: false };
    }

    case 'SET_START':
      return { ...initialSelectionState, phase: 'start_set', start: action.date };

    case 'CLEAR':
      return initialSelectionState;

    default:
      return state;
  }
}

export function useRangeSelection() {
  const [selection, dispatch] = useReducer(selectionReducer, initialSelectionState);
  const pointerDownRef = useRef<CalendarDate | null>(null);
  const hasDraggedRef = useRef(false);
  const suppressClickRef = useRef(false);

  const onCellClick = useCallback((date: CalendarDate) => {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      hasDraggedRef.current = false;
      return;
    }

    dispatch({ type: 'CLICK', date });
  }, []);

  const onCellPointerDown = useCallback((date: CalendarDate) => {
    pointerDownRef.current = date;
    hasDraggedRef.current = false;
    suppressClickRef.current = false;

    if (selection.phase !== 'start_set') {
      dispatch({ type: 'DRAG_START', date });
      suppressClickRef.current = true;
    }
  }, [selection.phase]);

  const onCellPointerEnter = useCallback((date: CalendarDate) => {
    if (!pointerDownRef.current) return;

    if (!hasDraggedRef.current) {
      hasDraggedRef.current = true;
      suppressClickRef.current = true;

      if (!selection.isDragging) {
        dispatch({ type: 'DRAG_START', date: pointerDownRef.current });
      }
    }

    dispatch({ type: 'DRAG_MOVE', date });
  }, [selection.isDragging]);

  const onCellPointerUp = useCallback(() => {
    if (selection.isDragging) {
      dispatch({ type: 'DRAG_END' });
    }

    pointerDownRef.current = null;
  }, [selection.isDragging]);

  const clearSelection = useCallback(() => {
    dispatch({ type: 'CLEAR' });
    pointerDownRef.current = null;
    hasDraggedRef.current = false;
    suppressClickRef.current = false;
  }, []);

  const setSelectionStart = useCallback((date: CalendarDate) => {
    dispatch({ type: 'SET_START', date });
    pointerDownRef.current = null;
    hasDraggedRef.current = false;
    suppressClickRef.current = false;
  }, []);

  return {
    selection,
    onCellClick,
    onCellPointerDown,
    onCellPointerEnter,
    onCellPointerUp,
    clearSelection,
    setSelectionStart,
  };
}
