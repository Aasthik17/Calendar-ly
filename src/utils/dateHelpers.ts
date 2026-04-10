import { CalendarDate, ViewMonth } from '@/types/calendar';

const MONTH_NAMES_FULL = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const MONTH_NAMES_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

const DAY_NAMES = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
];

export { MONTH_NAMES_FULL, MONTH_NAMES_SHORT, DAY_NAMES };

/** Helper to get current Date based on IST */
function getISTDateParts() {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric'
  }).formatToParts(new Date());

  let year = 0, month = 0, day = 0;
  for (const part of parts) {
    if (part.type === 'year') year = parseInt(part.value, 10);
    if (part.type === 'month') month = parseInt(part.value, 10);
    if (part.type === 'day') day = parseInt(part.value, 10);
  }
  return { year, month, day };
}

/** Returns today as CalendarDate in IST */
export function today(): CalendarDate {
  const { year, month, day } = getISTDateParts();
  return { year, month, day };
}

/** Deep equality check for two CalendarDates */
export function isSameDate(a: CalendarDate, b: CalendarDate): boolean {
  return a.year === b.year && a.month === b.month && a.day === b.day;
}

/** Returns true if a < b chronologically */
export function isBeforeDate(a: CalendarDate, b: CalendarDate): boolean {
  if (a.year !== b.year) return a.year < b.year;
  if (a.month !== b.month) return a.month < b.month;
  return a.day < b.day;
}

/** Returns [earlier, later] */
export function sortDates(a: CalendarDate, b: CalendarDate): [CalendarDate, CalendarDate] {
  if (isBeforeDate(a, b) || isSameDate(a, b)) return [a, b];
  return [b, a];
}

/** Handles year rollover when adding/subtracting months */
export function addMonths(vm: ViewMonth, n: number): ViewMonth {
  const totalMonths = (vm.year * 12 + (vm.month - 1)) + n;
  return {
    year: Math.floor(totalMonths / 12),
    month: (totalMonths % 12) + 1,
  };
}

/** Returns the number of days in a given month, handling leap years */
export function getDaysInMonth(year: number, month: number): number {
  // month is 1-indexed; Date constructor's month is 0-indexed.
  // Day 0 of the *next* month gives the last day of *this* month.
  return new Date(year, month, 0).getDate();
}

/** Returns the Monday-start offset (0=Monday, 6=Sunday) for the first day of the month */
export function getFirstDayOfWeek(year: number, month: number): number {
  const jsDay = new Date(year, month - 1, 1).getDay(); // 0=Sun
  return (jsDay + 6) % 7; // Convert to Mon=0
}

/** Formats as "July 5, 2025" */
export function formatDateLabel(date: CalendarDate): string {
  return `${MONTH_NAMES_FULL[date.month - 1]} ${date.day}, ${date.year}`;
}

/** Formats as "Jul 5 – Jul 12" or "Jul 29 – August 3" */
export function formatRangeLabel(start: CalendarDate, end: CalendarDate): string {
  const startMonth = MONTH_NAMES_SHORT[start.month - 1];
  if (start.month === end.month && start.year === end.year) {
    return `${startMonth} ${start.day} – ${startMonth} ${end.day}`;
  }
  // Different months — use full name for end
  const endMonth = MONTH_NAMES_FULL[end.month - 1];
  return `${startMonth} ${start.day} – ${endMonth} ${end.day}`;
}

/** Formats as short range for summary bar: "Jul 5 → Jul 12" */
export function formatRangeSummary(start: CalendarDate, end: CalendarDate): string {
  const startMonth = MONTH_NAMES_SHORT[start.month - 1];
  if (start.month === end.month && start.year === end.year) {
    return `${startMonth} ${start.day} → ${startMonth} ${end.day}`;
  }

  const endMonth = MONTH_NAMES_FULL[end.month - 1];
  return `${startMonth} ${start.day} → ${endMonth} ${end.day}`;
}

/** Returns "YYYY-MM-DD" */
export function toNoteKey(date: CalendarDate): string {
  const mm = String(date.month).padStart(2, '0');
  const dd = String(date.day).padStart(2, '0');
  return `${date.year}-${mm}-${dd}`;
}

/** Returns "YYYY-MM" */
export function toMonthKey(vm: ViewMonth): string {
  const mm = String(vm.month).padStart(2, '0');
  return `${vm.year}-${mm}`;
}

/** Returns "YYYY-MM-DD:YYYY-MM-DD" */
export function toRangeKey(start: CalendarDate, end: CalendarDate): string {
  return `${toNoteKey(start)}:${toNoteKey(end)}`;
}

/** Inclusive count of days between start and end */
export function countDaysInRange(start: CalendarDate, end: CalendarDate): number {
  const s = new Date(start.year, start.month - 1, start.day);
  const e = new Date(end.year, end.month - 1, end.day);
  return Math.round(Math.abs(e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
}

/** Boundary-inclusive check: is date within [start, end]? */
export function isDateInRange(date: CalendarDate, start: CalendarDate, end: CalendarDate): boolean {
  const [s, e] = sortDates(start, end);
  return (isSameDate(date, s) || isBeforeDate(s, date)) &&
         (isSameDate(date, e) || isBeforeDate(date, e));
}

/** Returns the current month as ViewMonth in IST */
export function getCurrentViewMonth(): ViewMonth {
  const { year, month } = getISTDateParts();
  return { year, month };
}

/** Returns the day-of-week name for a CalendarDate */
export function getDayOfWeek(date: CalendarDate): string {
  const jsDay = new Date(date.year, date.month - 1, date.day).getDay();
  const mondayIndex = (jsDay + 6) % 7;
  return DAY_NAMES[mondayIndex];
}
