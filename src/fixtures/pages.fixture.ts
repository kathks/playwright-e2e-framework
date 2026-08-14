import { test as base } from '@playwright/test';
import {
  CartPage,
  CheckoutDetailsPage,
  CheckoutOverviewPage,
  InventoryPage,
  LoginPage,
  OrderConfirmationPage,
} from '../pages';
import { users } from '../data/users';

/**
 * Custom fixtures = dependency injection for page objects.
 *
 * Instead of every test doing `const loginPage = new LoginPage(page)`, tests
 * declare the pages they need in their signature and Playwright constructs
 * them lazily. Two benefits:
 *   1. Tests stay free of setup noise and read as behaviour.
 *   2. Adding a page object to the framework never requires touching tests.
 *
 * `loggedIn` is a state fixture: it performs authentication once per test and
 * hands back a ready inventory page, so no test repeats the login steps.
 */
export interface Pages {
  loginPage: LoginPage;
  inventoryPage: InventoryPage;
  cartPage: CartPage;
  checkoutDetailsPage: CheckoutDetailsPage;
  checkoutOverviewPage: CheckoutOverviewPage;
  orderConfirmationPage: OrderConfirmationPage;
  /** An authenticated session sitting on the product list. */
  loggedIn: InventoryPage;
}

export const test = base.extend<Pages>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },

  inventoryPage: async ({ page }, use) => {
    await use(new InventoryPage(page));
  },

  cartPage: async ({ page }, use) => {
    await use(new CartPage(page));
  },

  checkoutDetailsPage: async ({ page }, use) => {
    await use(new CheckoutDetailsPage(page));
  },

  checkoutOverviewPage: async ({ page }, use) => {
    await use(new CheckoutOverviewPage(page));
  },

  orderConfirmationPage: async ({ page }, use) => {
    await use(new OrderConfirmationPage(page));
  },

  loggedIn: async ({ loginPage, inventoryPage }, use) => {
    await loginPage.open();
    await loginPage.loginAs(users.standard);
    await inventoryPage.expectLoaded();

    await use(inventoryPage);
  },
});

export { expect } from '@playwright/test';
