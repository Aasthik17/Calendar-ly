// A simple date representation used throughout (avoids timezone headaches with Date objects)
export type CalendarDate = {
  year: number;
  month: number; // 1-indexed (January = 1)
  day: number;
};

// The three phases of the range selection state machine
export type SelectionPhase = 'idle' | 'start_set' | 'range_set';

export type SelectionState = {
  phase: SelectionPhase;
  start: CalendarDate | null;
  end: CalendarDate | null;
  // During a drag, this holds the live preview end date (may differ from confirmed `end`)
  previewEnd: CalendarDate | null;
  isDragging: boolean;
};

// What a single calendar cell knows about itself
export type DateCellState =
  | 'default'
  | 'today'
  | 'range-start'
  | 'range-end'
  | 'range-start-end'   // single-day selection
  | 'in-range'
  | 'in-range-preview'  // during active drag, not yet confirmed
  | 'other-month'
  | 'disabled';

export type CalendarDay = {
  date: CalendarDate;
  cellState: DateCellState;
  isOtherMonth: boolean;
  hasNote: boolean;
};

// Notes storage
export type NotesStore = {
  // Key format: "YYYY-MM" for month notes, "YYYY-MM-DD:YYYY-MM-DD" for range notes
  [key: string]: string;
};

export type ViewMonth = {
  year: number;
  month: number; // 1-indexed
};

// Direction tracking for animation
export type NavDirection = 'prev' | 'next' | null;
