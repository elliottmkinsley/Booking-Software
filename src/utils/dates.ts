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
