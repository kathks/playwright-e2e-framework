import { test, expect } from '@fixtures/pages.fixture';
import { products } from '@data/products';

test.describe('Shopping cart', { tag: '@cart' }, () => {
  test('the badge reflects the number of items added @smoke', async ({ loggedIn }) => {
    await loggedIn.header.expectCartCount(0);

    await loggedIn.addToCart(products.backpack);
    await loggedIn.header.expectCartCount(1);

    await loggedIn.addToCart(products.bikeLight, products.fleeceJacket);
    await loggedIn.header.expectCartCount(3);
  });

  test('removing an item from the catalogue updates the badge @regression', async ({ loggedIn }) => {
    await loggedIn.addToCart(products.backpack, products.onesie);
    await loggedIn.header.expectCartCount(2);

    await loggedIn.removeFromCart(products.onesie);

    await loggedIn.header.expectCartCount(1);
  });

  test('selected items carry over to the cart page @smoke', async ({ loggedIn, cartPage }) => {
    await loggedIn.addToCart(products.backpack, products.boltTShirt);
    await loggedIn.header.openCart();

    await cartPage.expectLoaded();
    await cartPage.expectContains(products.backpack, products.boltTShirt);
    expect(await cartPage.lineItemCount()).toBe(2);
    expect(await cartPage.quantityOf(products.backpack)).toBe(1);
  });

  test('an item removed on the cart page is gone from the order @regression', async ({
    loggedIn,
    cartPage,
  }) => {
    await loggedIn.addToCart(products.backpack, products.bikeLight);
    await loggedIn.header.openCart();

    await cartPage.removeItem(products.bikeLight);

    expect(await cartPage.lineItemCount()).toBe(1);
    await cartPage.header.expectCartCount(1);
    expect(await cartPage.productNames()).toEqual([products.backpack]);
  });

  test('the cart survives navigating back to the catalogue @regression', async ({
    loggedIn,
    cartPage,
  }) => {
    await loggedIn.addToCart(products.fleeceJacket);
    await loggedIn.header.openCart();
    await cartPage.continueShoppingButton.click();

    await loggedIn.expectLoaded();
    await loggedIn.header.expectCartCount(1);
    await loggedIn.expectItemAdded(products.fleeceJacket);
  });
});
