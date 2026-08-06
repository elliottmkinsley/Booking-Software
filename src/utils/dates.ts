/** ISO date (YYYY-MM-DD) in the user's local timezone, not UTC. */
export function isoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function todayIso(): string {
  return isoDate(new Date());
}

export function addDays(days: number, from = new Date()): Date {
  const result = new Date(from);
  result.setDate(result.getDate() + days);
  return result;
}

export function isoDateOffset(days: number): string {
  return isoDate(addDays(days));
}

/** ISO dates sort lexicographically, so plain string compares are safe here. */
export function bookingCoversDate(
  booking: { startDate: string; endDate: string },
  date: string
): boolean {
  return booking.startDate <= date && booking.endDate >= date;
}

export function formatDateRange(startDate: string, endDate: string): string {
  return startDate === endDate ? startDate : `${startDate} to ${endDate}`;
}

/** Parsed at noon so DST shifts can never move the date. */
export function parseIsoDate(date: string): Date {
  return new Date(`${date}T12:00:00`);
}

export function daysBetween(from: string, to: string): number {
  const ms = parseIsoDate(to).getTime() - parseIsoDate(from).getTime();
  return Math.round(ms / 86_400_000);
}

/**
 * Month grid cells with leading nulls so the 1st lands on the right weekday.
 */
export function buildMonthCells(
  year: number,
  month: number
): (string | null)[] {
  const leadingBlanks = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (string | null)[] = Array(leadingBlanks).fill(null);
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(isoDate(new Date(year, month, day)));
  }
  return cells;
}

/** Collapses a set of picked days into the fewest start/end ranges. */
export function mergeContiguousDates(
  dates: string[]
): { start: string; end: string }[] {
  const sorted = [...new Set(dates)].sort();
  const ranges: { start: string; end: string }[] = [];
  for (const date of sorted) {
    const last = ranges[ranges.length - 1];
    if (last && daysBetween(last.end, date) === 1) {
      last.end = date;
    } else {
      ranges.push({ start: date, end: date });
    }
  }
  return ranges;
}

export function formatDayLabel(date: string): string {
  return parseIsoDate(date).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}
