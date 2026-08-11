import {
  habitConsistency,
  movingAverage,
  weeklyKcalAverages,
} from './progressStats';
import type {Habit, HabitLog} from './habits';
import type {MealEntry} from './meals';

function meal(
  date: string,
  kcal: number,
  id = `${date}-${kcal}`,
): MealEntry {
  return {
    id,
    date,
    category: 'lunch',
    foodId: null,
    name: 'Test',
    serving: '1',
    portions: 1,
    kcal,
    proteinG: 0,
    createdAt: null,
  };
}

describe('movingAverage', () => {
  it('omits thin windows and averages across gaps only when enough points sit in the window', () => {
    // Readings on days 1, 2, 3, then a gap, then 10, 11, 12.
    // Centred 7-day window needs ≥3 readings — early/late endpoints
    // near the gap still gather neighbours when they fall in ±3 days.
    const points = [
      {date: '2026-07-01', kg: 70},
      {date: '2026-07-02', kg: 71},
      {date: '2026-07-03', kg: 72},
      {date: '2026-07-10', kg: 73},
      {date: '2026-07-11', kg: 74},
      {date: '2026-07-12', kg: 75},
    ];
    const trend = movingAverage(points, 7);

    // Jul 1 window: Jul 1–4 → only 3 points (1,2,3) → included
    // Jul 3 window: Jun 30–Jul 6 → 3 points
    // Jul 10 window: Jul 7–13 → 3 points (10,11,12)
    expect(trend.length).toBeGreaterThanOrEqual(2);
    expect(trend.every(t => Number.isFinite(t.kg))).toBe(true);

    // A lone reading with a long gap on both sides is omitted.
    const sparse = [
      {date: '2026-07-01', kg: 70},
      {date: '2026-07-02', kg: 71},
      {date: '2026-07-20', kg: 80},
    ];
    const sparseTrend = movingAverage(sparse, 7);
    // Jul 20 alone in its window → omitted; Jul 1–2 only have 2 → omitted
    expect(sparseTrend).toHaveLength(0);
  });
});

describe('weeklyKcalAverages', () => {
  it('excludes unlogged days from the average', () => {
    // Week of Mon 3 Aug 2026. Log only Wed/Thu/Fri at 1500/1800/2100.
    const entries = [
      meal('2026-08-05', 1500),
      meal('2026-08-06', 1800),
      meal('2026-08-07', 2100),
    ];
    const weeks = weeklyKcalAverages(entries, '2026-08-03', '2026-08-09');
    expect(weeks).toHaveLength(1);
    expect(weeks[0].weekStart).toBe('2026-08-03');
    expect(weeks[0].daysLogged).toBe(3);
    // Average of 3 days, not diluted by 4 silent days.
    expect(weeks[0].avgKcal).toBe(1800);
  });
});

describe('habitConsistency', () => {
  it('does not penalise days before a habit existed', () => {
    const habits: Habit[] = [
      {
        id: 'h1',
        name: 'Walk',
        kind: 'binary',
        icon: 'Footprints',
        target: null,
        unit: null,
        order: 0,
        archived: false,
        createdAt: new Date(2026, 7, 9), // 9 Aug local
      },
    ];
    const logs: HabitLog[] = [
      {
        id: '2026-08-09_h1',
        habitId: 'h1',
        date: '2026-08-09',
        value: 1,
        target: null,
        completed: true,
        updatedAt: null,
      },
      {
        id: '2026-08-10_h1',
        habitId: 'h1',
        date: '2026-08-10',
        value: 1,
        target: null,
        completed: true,
        updatedAt: null,
      },
      {
        id: '2026-08-11_h1',
        habitId: 'h1',
        date: '2026-08-11',
        value: 0,
        target: null,
        completed: false,
        updatedAt: null,
      },
    ];
    // 30-day-ish window that starts well before the habit.
    const result = habitConsistency(habits, logs, '2026-07-13', '2026-08-11');
    expect(result).toHaveLength(1);
    // possibleDays = Aug 9–11 inclusive = 3, not the full 30.
    expect(result[0].possibleDays).toBe(3);
    expect(result[0].completedDays).toBe(2);
  });
});
