import {FOODS} from './foods';

describe('FOODS library', () => {
  it('has unique ids', () => {
    const ids = FOODS.map(f => f.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('has positive kcal for every item', () => {
    for (const food of FOODS) {
      expect(food.kcal).toBeGreaterThan(0);
    }
  });
});
