import {searchFoods} from './foodSearch';

describe('searchFoods', () => {
  it('finds poha by name', () => {
    const results = searchFoods('poha');
    expect(results.some(f => f.id === 'poha')).toBe(true);
  });

  it('finds poha by alias aval', () => {
    const results = searchFoods('aval');
    expect(results.some(f => f.id === 'poha')).toBe(true);
  });

  it('finds curd by alias dahi', () => {
    const results = searchFoods('dahi');
    expect(results.some(f => f.id === 'curd')).toBe(true);
  });

  it('ranks prefix matches above substring', () => {
    const results = searchFoods('dal');
    expect(results[0].name.toLowerCase().startsWith('dal')).toBe(true);
  });
});
