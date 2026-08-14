import { test, expect } from '@fixtures/pages.fixture';
import { TAX_RATE, defaultCustomer, products } from '@data/products';

/**
 * The headline end-to-end journey: browse -> select -> cart -> checkout -> confirmation.
 *
 * `test.step` groups the flow into business-readable phases, so the HTML report
 * shows a stakeholder-friendly narrative and a failure points at the exact
 * phase that broke rather than a bare line number.
 */
test.describe('End-to-end purchase journey', { tag: '@e2e' }, () => {
  test('a customer can complete a two-item order @smoke @e2e', async ({
    loggedIn,
    cartPage,
    checkoutDetailsPage,
    checkoutOverviewPage,
    orderConfirmationPage,
  }) => {
    const basket = [products.backpack, products.fleeceJacket] as const;
    let expectedSubtotal = 0;

    await test.step('Select products from the catalogue', async () => {
      for (const item of basket) {
        expectedSubtotal += await loggedIn.priceOf(item);
      }
      await loggedIn.addToCart(...basket);
      await loggedIn.header.expectCartCount(basket.length);
    });

    await test.step('Review the cart', async () => {
      await loggedIn.header.openCart();
      await cartPage.expectLoaded();
      await cartPage.expectContains(...basket);
      expect(await cartPage.lineItemCount()).toBe(basket.length);
    });

    await test.step('Provide delivery details', async () => {
      await cartPage.proceedToCheckout();
      await checkoutDetailsPage.expectLoaded();
      await checkoutDetailsPage.fillAndContinue(defaultCustomer);
    });

    await test.step('Verify the order summary and totals', async () => {
      await checkoutOverviewPage.expectLoaded();
      await checkoutOverviewPage.expectContains(...basket);

      const subtotal = await checkoutOverviewPage.subtotal();
      const tax = await checkoutOverviewPage.tax();
      const total = await checkoutOverviewPage.total();

      // Business rule verification, not just "the page rendered".
      expect(subtotal, 'subtotal should equal the sum of item prices').toBeCloseTo(
        expectedSubtotal,
        2,
      );
      expect(tax, `tax should be ${TAX_RATE * 100}% of the subtotal`).toBeCloseTo(
        Number((subtotal * TAX_RATE).toFixed(2)),
        2,
      );
      expect(total, 'total should equal subtotal plus tax').toBeCloseTo(subtotal + tax, 2);
    });

    await test.step('Place the order', async () => {
      await checkoutOverviewPage.finish();
      await orderConfirmationPage.expectOrderPlaced();
      await orderConfirmationPage.expectUrlToContain('checkout-complete.html');
    });

    await test.step('The cart is emptied after purchase', async () => {
      await orderConfirmationPage.backToProducts();
      await loggedIn.expectLoaded();
      await loggedIn.header.expectCartCount(0);
    });
  });

  test('checkout blocks submission when the postal code is missing @regression', async ({
    loggedIn,
    cartPage,
    checkoutDetailsPage,
  }) => {
    await loggedIn.addToCart(products.onesie);
    await loggedIn.header.openCart();
    await cartPage.proceedToCheckout();

    await checkoutDetailsPage.fillDetails({ ...defaultCustomer, postalCode: '' });
    await checkoutDetailsPage.submit();

    await checkoutDetailsPage.expectError('Postal Code is required');
    await checkoutDetailsPage.expectUrlToContain('checkout-step-one.html');
  });
});
