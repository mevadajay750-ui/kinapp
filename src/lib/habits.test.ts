import {
  habitLogId,
  isHabitCompleted,
  weekDotStatus,
  consecutiveStreak,
  HabitLogLike,
} from './habitLogic';

function completedLog(date: string, habitId = 'h1'): HabitLogLike {
  return {
    id: `${date}_${habitId}`,
    habitId,
    date,
    value: 1,
    target: null,
    completed: true,
  };
}

describe('habitLogic', () => {
  it('builds composite log ids', () => {
    expect(habitLogId('2026-08-11', 'abc123')).toBe('2026-08-11_abc123');
  });

  it('computes completed for each kind', () => {
    expect(isHabitCompleted('binary', 1, null)).toBe(true);
    expect(isHabitCompleted('binary', 0, null)).toBe(false);
    expect(isHabitCompleted('count', 8, 8)).toBe(true);
    expect(isHabitCompleted('count', 7, 8)).toBe(false);
    expect(isHabitCompleted('amount', 7.5, 7.5)).toBe(true);
    expect(isHabitCompleted('amount', 5, 7.5)).toBe(false);
    expect(isHabitCompleted('count', 1, null)).toBe(false);
  });

  it('weekDotStatus hides days before habit creation', () => {
    expect(weekDotStatus('2026-08-10', '2026-08-11', undefined)).toBeNull();
    expect(weekDotStatus('2026-08-11', '2026-08-11', undefined)).toBe('missed');
  });

  it('weekDotStatus marks complete, partial, and missed', () => {
    const complete = completedLog('2026-08-11');
    complete.value = 8;
    complete.target = 8;
    const partial: HabitLogLike = {
      ...complete,
      value: 3,
      completed: false,
    };
    expect(weekDotStatus('2026-08-11', '2026-08-01', complete)).toBe(
      'complete',
    );
    expect(weekDotStatus('2026-08-11', '2026-08-01', partial)).toBe('partial');
    expect(weekDotStatus('2026-08-11', '2026-08-01', undefined)).toBe('missed');
  });

  it('consecutiveStreak only returns values of 3 or more', () => {
    const map = new Map<string, HabitLogLike>();
    for (const day of ['2026-08-09', '2026-08-10', '2026-08-11']) {
      map.set(`${day}_h1`, completedLog(day));
    }
    expect(consecutiveStreak('2026-08-11', 'h1', map, '2026-08-01')).toBe(3);

    const two = new Map(map);
    two.delete('2026-08-09_h1');
    expect(consecutiveStreak('2026-08-11', 'h1', two, '2026-08-01')).toBe(0);
  });
});
