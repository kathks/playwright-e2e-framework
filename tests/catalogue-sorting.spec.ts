import { test, expect } from '@fixtures/pages.fixture';

test.describe('Catalogue sorting', { tag: '@catalogue' }, () => {
  test('products sort by price low to high @regression', async ({ loggedIn }) => {
    await loggedIn.sortBy('lohi');

    const prices = await loggedIn.displayedPrices();
    expect(prices).toEqual([...prices].sort((a, b) => a - b));
  });

  test('products sort by price high to low @regression', async ({ loggedIn }) => {
    await loggedIn.sortBy('hilo');

    const prices = await loggedIn.displayedPrices();
    expect(prices).toEqual([...prices].sort((a, b) => b - a));
  });

  test('products sort alphabetically Z to A @regression', async ({ loggedIn }) => {
    await loggedIn.sortBy('za');

    const names = await loggedIn.displayedNames();
    expect(names).toEqual([...names].sort((a, b) => b.localeCompare(a)));
  });
});
