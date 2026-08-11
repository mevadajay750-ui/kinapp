import {localDateKey, addDays, isToday, formatDateLabel} from './dates';

describe('dates', () => {
  it('formats local date keys without UTC shift', () => {
    const d = new Date(2026, 7, 11, 23, 45, 0); // Aug 11 11:45pm local
    expect(localDateKey(d)).toBe('2026-08-11');
  });

  it('rolls to next local day after midnight', () => {
    const d = new Date(2026, 7, 12, 0, 15, 0);
    expect(localDateKey(d)).toBe('2026-08-12');
  });

  it('addDays and isToday work on local keys', () => {
    const today = localDateKey();
    expect(isToday(today)).toBe(true);
    expect(isToday(addDays(today, -1))).toBe(false);
    expect(addDays('2026-08-11', 1)).toBe('2026-08-12');
  });

  it('formatDateLabel handles today and yesterday', () => {
    const today = localDateKey();
    expect(formatDateLabel(today)).toBe('Today');
    expect(formatDateLabel(addDays(today, -1))).toBe('Yesterday');
    expect(formatDateLabel('2026-08-09')).toMatch(/^\w{3}, \d{1,2} \w{3}$/);
  });
});
