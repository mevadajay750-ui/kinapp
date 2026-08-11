import {addDays, localDateKey} from './dates';

export type HabitKind = 'binary' | 'count' | 'amount';

export type HabitLogLike = {
  id: string;
  habitId: string;
  date: string;
  value: number;
  target: number | null;
  completed: boolean;
};

export type WeekDotStatus = 'empty' | 'missed' | 'partial' | 'complete';

export function habitLogId(dateKey: string, habitId: string): string {
  return `${dateKey}_${habitId}`;
}

export function isHabitCompleted(
  kind: HabitKind,
  value: number,
  target: number | null,
): boolean {
  if (kind === 'binary') {
    return value === 1;
  }
  return target != null && value >= target;
}

/** Convert Firestore Timestamp-like or Date to local YYYY-MM-DD. */
export function createdDateKey(createdAt: unknown): string | null {
  if (!createdAt) {
    return null;
  }
  if (
    typeof createdAt === 'object' &&
    createdAt !== null &&
    'toDate' in createdAt &&
    typeof (createdAt as {toDate: unknown}).toDate === 'function'
  ) {
    return localDateKey((createdAt as {toDate: () => Date}).toDate());
  }
  if (createdAt instanceof Date) {
    return localDateKey(createdAt);
  }
  return null;
}

/** Status for one day in the 7-day row. `null` = habit did not exist yet. */
export function weekDotStatus(
  dateKey: string,
  habitCreatedKey: string | null,
  log: HabitLogLike | undefined,
): WeekDotStatus | null {
  if (habitCreatedKey && dateKey < habitCreatedKey) {
    return null;
  }
  if (!log) {
    return 'missed';
  }
  if (log.completed) {
    return 'complete';
  }
  if (log.value > 0) {
    return 'partial';
  }
  return 'missed';
}

/**
 * Consecutive completed days ending at endKey.
 * Returns 0 when below the display threshold of 3.
 */
export function consecutiveStreak(
  endKey: string,
  habitId: string,
  logsByKey: Map<string, HabitLogLike>,
  habitCreatedKey: string | null,
  maxLookback = 365,
): number {
  let streak = 0;
  let cursor = endKey;
  for (let i = 0; i < maxLookback; i++) {
    if (habitCreatedKey && cursor < habitCreatedKey) {
      break;
    }
    const log = logsByKey.get(habitLogId(cursor, habitId));
    if (!log?.completed) {
      break;
    }
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak >= 3 ? streak : 0;
}
