// Date helpers for the advent calendar.
// Hash format for tags: #MM.DD.YYYY (e.g. #11.02.2026).

export const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOVEMBER', 'DECEMBER'];

// 2026 birthday runway: 30 days, Nov 2 -> Dec 1. Candles light on Dec 2.
export const RUNWAY_START = new Date(2026, 10, 2);
export const FINALE_DATE = new Date(2026, 11, 2);
export const RUNWAY_DAYS = 30;

export function pad2(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

export function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function isSameDay(a: Date, b: Date): boolean {
  return startOfDay(a).getTime() === startOfDay(b).getTime();
}

/** Stable key for a day, e.g. "2026-11-02". */
export function dateKey(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

/** Key into the presents table, e.g. "NOVEMBER022026". */
export function presentKey(d: Date): string {
  return `${MONTHS[d.getMonth()]}${pad2(d.getDate())}${d.getFullYear()}`;
}

export function formatLong(d: Date): string {
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

export type ParsedHash =
  | { kind: 'date'; date: Date }
  | { kind: 'none' };

/**
 * Explicit MM.DD.YYYY parsing. The old version leaned on `new Date('#11/02/2026')`,
 * which Chrome tolerates but Safari (iPhone, where the tags get tapped) does not.
 */
export function parseHash(hash: string): ParsedHash {
  const h = hash.replace(/^#/, '').trim().toLowerCase();
  const m = /^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/.exec(h);
  if (!m) return { kind: 'none' };
  const month = Number(m[1]) - 1;
  const day = Number(m[2]);
  const year = Number(m[3]);
  const date = new Date(year, month, day);
  if (date.getFullYear() !== year || date.getMonth() !== month || date.getDate() !== day) {
    return { kind: 'none' };
  }
  return { kind: 'date', date };
}

export interface RunwayDay {
  n: number; // 1..30
  date: Date;
  key: string; // dateKey
}

export function runwayDays(): RunwayDay[] {
  const days: RunwayDay[] = [];
  for (let n = 1; n <= RUNWAY_DAYS; n++) {
    const date = new Date(RUNWAY_START.getFullYear(), RUNWAY_START.getMonth(), RUNWAY_START.getDate() + n - 1);
    days.push({ n, date, key: dateKey(date) });
  }
  return days;
}

export function isRunwayDay(d: Date): boolean {
  const key = dateKey(d);
  return runwayDays().some((day) => day.key === key);
}
