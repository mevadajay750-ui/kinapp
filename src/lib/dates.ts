/** Local calendar date as YYYY-MM-DD. Never use toISOString() — that's UTC
 *  and rolls over at the wrong moment for anyone east or west of London.
 *  A user in Ahmedabad logging dinner at 9pm must not have it land on tomorrow. */
export function localDateKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function parseDateKey(dateKey: string): Date {
  const [y, m, d] = dateKey.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(dateKey: string, delta: number): string {
  const date = parseDateKey(dateKey);
  date.setDate(date.getDate() + delta);
  return localDateKey(date);
}

export function isToday(dateKey: string): boolean {
  return dateKey === localDateKey();
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const;

export function formatDateLabel(dateKey: string): string {
  if (isToday(dateKey)) {
    return 'Today';
  }
  if (dateKey === addDays(localDateKey(), -1)) {
    return 'Yesterday';
  }
  const date = parseDateKey(dateKey);
  return `${WEEKDAYS[date.getDay()]}, ${date.getDate()} ${MONTHS[date.getMonth()]}`;
}
