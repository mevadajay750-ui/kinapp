import {addDays, daysBetween, localDateKey} from './dates';
import {createdDateKey} from './habitLogic';
import type {Habit, HabitLog} from './habits';
import type {MealEntry} from './meals';

export type RangeKey = '30d' | '90d' | 'all';

export type WeightPoint = {date: string; kg: number};
export type TrendPoint = {date: string; kg: number};

const MONTHS_SHORT = [
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

function parseDateKey(dateKey: string): Date {
  const [y, m, d] = dateKey.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** Monday-start week containing dateKey. */
export function mondayOfWeek(dateKey: string): string {
  const date = parseDateKey(dateKey);
  const day = date.getDay(); // 0 Sun … 6 Sat
  const delta = day === 0 ? -6 : 1 - day;
  return addDays(dateKey, delta);
}

/** Chart / axis label: `d MMM`. */
export function formatDayMonth(dateKey: string): string {
  const date = parseDateKey(dateKey);
  return `${date.getDate()} ${MONTHS_SHORT[date.getMonth()]}`;
}

/** Week row label: `4–10 Aug` (same month) or `28 Jul–3 Aug`. */
export function formatWeekRange(weekStart: string): string {
  const end = addDays(weekStart, 6);
  const startDate = parseDateKey(weekStart);
  const endDate = parseDateKey(end);
  const startDay = startDate.getDate();
  const endDay = endDate.getDate();
  const startMonth = MONTHS_SHORT[startDate.getMonth()];
  const endMonth = MONTHS_SHORT[endDate.getMonth()];
  if (startMonth === endMonth) {
    return `${startDay}–${endDay} ${startMonth}`;
  }
  return `${startDay} ${startMonth}–${endDay} ${endMonth}`;
}

/** Inclusive start key for a range selector. `all` uses earliestKey or today. */
export function rangeStartFor(
  key: RangeKey,
  today = localDateKey(),
  earliestKey?: string | null,
): string {
  if (key === '30d') {
    return addDays(today, -29);
  }
  if (key === '90d') {
    return addDays(today, -89);
  }
  if (earliestKey && earliestKey < today) {
    return earliestKey;
  }
  return today;
}

/**
 * Centred 7-day moving average. Windows with fewer than 3 readings are
 * omitted rather than averaged from thin data.
 */
export function movingAverage(
  points: WeightPoint[],
  windowDays = 7,
): TrendPoint[] {
  if (points.length === 0) {
    return [];
  }
  const sorted = [...points].sort((a, b) => a.date.localeCompare(b.date));
  const half = Math.floor(windowDays / 2);
  const out: TrendPoint[] = [];

  for (const point of sorted) {
    const windowStart = addDays(point.date, -half);
    const windowEnd = addDays(point.date, half);
    const inWindow = sorted.filter(
      p => p.date >= windowStart && p.date <= windowEnd,
    );
    if (inWindow.length < 3) {
      continue;
    }
    const sum = inWindow.reduce((acc, p) => acc + p.kg, 0);
    out.push({date: point.date, kg: sum / inWindow.length});
  }
  return out;
}

/**
 * Net change between the first and last trend values, not the first and
 * last raw readings — raw endpoints are the noisiest possible choice.
 */
export function netChange(trend: TrendPoint[]): number | null {
  if (trend.length < 2) {
    return null;
  }
  const first = trend[0];
  const last = trend[trend.length - 1];
  return Math.round((last.kg - first.kg) * 10) / 10;
}

export type WeeklyKcal = {
  weekStart: string;
  avgKcal: number;
  daysLogged: number;
};

/**
 * Weeks are Monday-start. Days with zero entries are excluded from the
 * average, not counted as zero.
 */
export function weeklyKcalAverages(
  entries: MealEntry[],
  rangeStart: string,
  rangeEnd: string,
): WeeklyKcal[] {
  const kcalByDate = new Map<string, number>();
  for (const entry of entries) {
    if (entry.date < rangeStart || entry.date > rangeEnd) {
      continue;
    }
    kcalByDate.set(entry.date, (kcalByDate.get(entry.date) ?? 0) + entry.kcal);
  }

  const firstMonday = mondayOfWeek(rangeStart);
  const weeks: WeeklyKcal[] = [];

  for (
    let weekStart = firstMonday;
    weekStart <= rangeEnd;
    weekStart = addDays(weekStart, 7)
  ) {
    let sum = 0;
    let daysLogged = 0;
    for (let i = 0; i < 7; i++) {
      const day = addDays(weekStart, i);
      if (day < rangeStart || day > rangeEnd) {
        continue;
      }
      const dayKcal = kcalByDate.get(day);
      if (dayKcal == null) {
        continue;
      }
      sum += dayKcal;
      daysLogged += 1;
    }
    if (daysLogged === 0) {
      continue;
    }
    weeks.push({
      weekStart,
      avgKcal: Math.round(sum / daysLogged),
      daysLogged,
    });
  }

  return weeks;
}

export type HabitConsistency = {
  habitId: string;
  name: string;
  completedDays: number;
  possibleDays: number;
};

/** possibleDays counts only days on or after the habit was created. */
export function habitConsistency(
  habits: Habit[],
  logs: HabitLog[],
  rangeStart: string,
  rangeEnd: string,
): HabitConsistency[] {
  const completedByHabit = new Map<string, Set<string>>();
  for (const log of logs) {
    if (!log.completed) {
      continue;
    }
    if (log.date < rangeStart || log.date > rangeEnd) {
      continue;
    }
    let set = completedByHabit.get(log.habitId);
    if (!set) {
      set = new Set();
      completedByHabit.set(log.habitId, set);
    }
    set.add(log.date);
  }

  const results: HabitConsistency[] = [];
  for (const habit of habits) {
    if (habit.archived) {
      continue;
    }
    const created = createdDateKey(habit.createdAt);
    const start = created && created > rangeStart ? created : rangeStart;
    if (start > rangeEnd) {
      continue;
    }
    const possibleDays = daysBetween(start, rangeEnd) + 1;
    const completedSet = completedByHabit.get(habit.id);
    let completedDays = 0;
    if (completedSet) {
      for (const date of completedSet) {
        if (date >= start && date <= rangeEnd) {
          completedDays += 1;
        }
      }
    }
    results.push({
      habitId: habit.id,
      name: habit.name,
      completedDays,
      possibleDays,
    });
  }
  return results;
}
