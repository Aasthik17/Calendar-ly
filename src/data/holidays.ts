// /src/data/holidays.ts

export type Holiday = {
  month: number;   // 1-indexed
  day: number;
  name: string;
  type: 'public' | 'observance' | 'cultural';
};

export const HOLIDAYS: Holiday[] = [
  // January
  { month: 1, day: 1,  name: "New Year's Day",          type: 'public' },
  { month: 1, day: 26, name: "Republic Day (India)",     type: 'public' },

  // February
  { month: 2, day: 14, name: "Valentine's Day",          type: 'cultural' },

  // March
  { month: 3, day: 8,  name: "International Women's Day",type: 'observance' },
  { month: 3, day: 17, name: "St. Patrick's Day",        type: 'cultural' },

  // April
  { month: 4, day: 1,  name: "April Fools' Day",         type: 'cultural' },
  { month: 4, day: 22, name: "Earth Day",                type: 'observance' },

  // May
  { month: 5, day: 1,  name: "International Labour Day", type: 'public' },
  { month: 5, day: 4,  name: "Star Wars Day",            type: 'cultural' },

  // June
  { month: 6, day: 5,  name: "World Environment Day",   type: 'observance' },
  { month: 6, day: 21, name: "World Music Day",          type: 'cultural' },

  // July
  { month: 7, day: 4,  name: "Independence Day (US)",    type: 'public' },

  // August
  { month: 8, day: 15, name: "Independence Day (India)", type: 'public' },

  // September
  { month: 9, day: 5,  name: "Teachers' Day (India)",    type: 'observance' },

  // October
  { month: 10, day: 2,  name: "Gandhi Jayanti",          type: 'public' },
  { month: 10, day: 31, name: "Halloween",               type: 'cultural' },

  // November
  { month: 11, day: 11, name: "Veterans Day / Remembrance Day", type: 'public' },

  // December
  { month: 12, day: 25, name: "Christmas Day",           type: 'public' },
  { month: 12, day: 31, name: "New Year's Eve",          type: 'cultural' },
];

/** Returns the holiday for a specific date, or undefined if none */
export function getHolidayForDate(month: number, day: number): Holiday | undefined {
  return HOLIDAYS.find(h => h.month === month && h.day === day);
}

/** Returns all holidays for a given month */
export function getHolidaysForMonth(month: number): Holiday[] {
  return HOLIDAYS.filter(h => h.month === month);
}
