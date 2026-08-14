import { test, expect } from '@fixtures/pages.fixture';
import { invalidLogins, users } from '@data/users';

test.describe('Authentication', { tag: '@auth' }, () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.open();
  });

  test('a valid user reaches the product catalogue @smoke', async ({ loginPage, inventoryPage }) => {
    await loginPage.loginAs(users.standard);

    await inventoryPage.expectLoaded();
    await inventoryPage.expectUrlToContain('inventory.html');
    expect(await inventoryPage.itemCount()).toBeGreaterThan(0);
  });

  test('a locked out user is told to contact an administrator @regression', async ({ loginPage }) => {
    await loginPage.loginAs(users.lockedOut);

    await loginPage.expectError('Sorry, this user has been locked out');
    await expect(loginPage.loginButton).toBeVisible();
  });

  /**
   * Data-driven negative coverage: one test body, four scenarios, four
   * independent results in the report. Adding a case is a one-line change
   * to the data file rather than a copy-pasted test.
   */
  for (const { scenario, username, password, expectedError } of invalidLogins) {
    test(`login is rejected with ${scenario} @regression`, async ({ loginPage }) => {
      await loginPage.login(username, password);

      await loginPage.expectError(expectedError);
      await expect(loginPage.loginButton).toBeVisible();
    });
  }

  test('logging out returns the user to the login screen @regression', async ({
    loggedIn,
    loginPage,
  }) => {
    await loggedIn.header.logout();

    await expect(loginPage.loginButton).toBeVisible();
  });
});
