import {computeDayStats, computeHabitProgress, plateCopy, greetingForHour} from './dayStats';
import type {MealEntry} from './meals';
import type {Habit, HabitLog} from './habits';

describe('dayStats', () => {
  it('sums kcal and protein and groups by category', () => {
    const entries: MealEntry[] = [
      {
        id: '1',
        date: '2026-08-11',
        category: 'breakfast',
        foodId: 'poha',
        name: 'Poha',
        serving: '1 bowl',
        portions: 1,
        kcal: 250,
        proteinG: 5,
        createdAt: null,
      },
      {
        id: '2',
        date: '2026-08-11',
        category: 'snack',
        foodId: null,
        name: 'Chai',
        serving: '1 cup',
        portions: 1,
        kcal: 80,
        proteinG: 2,
        createdAt: null,
      },
    ];
    const stats = computeDayStats(entries);
    expect(stats.kcal).toBe(330);
    expect(stats.proteinG).toBe(7);
    expect(stats.entryCount).toBe(2);
    expect(stats.byCategory.breakfast).toBe(250);
    expect(stats.byCategory.snack).toBe(80);
  });

  it('counts completed habit logs only', () => {
    const habits = [
      {id: 'a', name: 'A', kind: 'binary', icon: 'Sun', target: null, unit: null, order: 0, archived: false, createdAt: null},
      {id: 'b', name: 'B', kind: 'binary', icon: 'Moon', target: null, unit: null, order: 1, archived: false, createdAt: null},
    ] as Habit[];
    const logs = [
      {id: '1', habitId: 'a', date: '2026-08-11', value: 1, target: null, completed: true, updatedAt: null},
      {id: '2', habitId: 'b', date: '2026-08-11', value: 0, target: null, completed: false, updatedAt: null},
    ] as HabitLog[];
    expect(computeHabitProgress(habits, logs)).toEqual({done: 1, total: 2});
  });

  it('plateCopy matches known states', () => {
    expect(plateCopy(0, 1600)).toMatch(/chai/);
    expect(plateCopy(100, 1600)).toMatch(/to go/);
    expect(plateCopy(1700, 1600)).toMatch(/over today/);
  });

  it('greeting drops name when empty', () => {
    expect(greetingForHour(9, '')).toBe('Good morning.');
    expect(greetingForHour(9, 'Priya Shah')).toBe('Good morning, Priya.');
    expect(greetingForHour(14, 'Priya')).toBe('Good afternoon, Priya.');
    expect(greetingForHour(19, 'Priya')).toBe('Good evening, Priya.');
  });
});
