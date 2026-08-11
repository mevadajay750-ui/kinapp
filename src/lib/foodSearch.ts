import {FOODS, Food, MealCategory} from '../data/foods';

function sortNonEggFirst(a: Food, b: Food): number {
  const aEgg = a.contains_egg ? 1 : 0;
  const bEgg = b.contains_egg ? 1 : 0;
  return aEgg - bEgg;
}

function categoryFoods(category?: MealCategory): Food[] {
  const list = category
    ? FOODS.filter(f => f.categories.includes(category))
    : [...FOODS];
  return list.slice().sort(sortNonEggFirst);
}

export function searchFoods(query: string, category?: MealCategory): Food[] {
  const trimmed = query.trim().toLowerCase();
  const pool = categoryFoods(category);

  if (!trimmed) {
    return pool;
  }

  const prefix: Food[] = [];
  const substring: Food[] = [];

  for (const food of pool) {
    const name = food.name.toLowerCase();
    const aliases = (food.aliases ?? []).map(a => a.toLowerCase());
    const names = [name, ...aliases];

    if (names.some(n => n.startsWith(trimmed))) {
      prefix.push(food);
    } else if (names.some(n => n.includes(trimmed))) {
      substring.push(food);
    }
  }

  return [...prefix, ...substring];
}
