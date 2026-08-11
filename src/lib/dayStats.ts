import type {MealCategory} from '../data/foods';
import type {MealEntry} from './meals';
import type {Habit, HabitLog} from './habits';

export type DayStats = {
  kcal: number;
  proteinG: number;
  entryCount: number;
  byCategory: Record<MealCategory, number>;
};

const EMPTY_BY_CATEGORY: Record<MealCategory, number> = {
  breakfast: 0,
  lunch: 0,
  dinner: 0,
  snack: 0,
};

export function computeDayStats(entries: MealEntry[]): DayStats {
  const byCategory: Record<MealCategory, number> = {...EMPTY_BY_CATEGORY};
  let kcal = 0;
  let proteinG = 0;

  for (const e of entries) {
    kcal += e.kcal;
    proteinG += e.proteinG;
    if (byCategory[e.category] != null) {
      byCategory[e.category] += e.kcal;
    }
  }

  return {
    kcal,
    proteinG,
    entryCount: entries.length,
    byCategory,
  };
}

export type HabitProgress = {done: number; total: number};

/** Counts habits whose log has `completed === true` — same field setHabitValue writes. */
export function computeHabitProgress(
  habits: Habit[],
  logs: HabitLog[],
): HabitProgress {
  const byHabit = new Map(logs.map(l => [l.habitId, l]));
  let done = 0;
  for (const habit of habits) {
    if (byHabit.get(habit.id)?.completed === true) {
      done += 1;
    }
  }
  return {done, total: habits.length};
}

export function plateCopy(consumed: number, target: number): string {
  if (consumed === 0) {
    return 'Nothing logged yet. Even a cup of chai counts.';
  }
  const ratio = target > 0 ? consumed / target : 0;
  if (ratio < 0.85) {
    const n = Math.max(0, Math.round(target - consumed));
    return `${n.toLocaleString()} kcal to go.`;
  }
  if (ratio <= 1) {
    return 'Nearly there. A lighter supper would round it off.';
  }
  const over = Math.round(consumed - target);
  return `${over.toLocaleString()} over today. Worth noticing, not worth worrying about.`;
}

export function firstName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) {
    return '';
  }
  return trimmed.split(/\s+/)[0] ?? '';
}

export function greetingForHour(hour: number, name: string): string {
  const first = firstName(name);
  let base: string;
  if (hour < 12) {
    base = 'Good morning';
  } else if (hour < 17) {
    base = 'Good afternoon';
  } else {
    base = 'Good evening';
  }
  return first ? `${base}, ${first}.` : `${base}.`;
}
