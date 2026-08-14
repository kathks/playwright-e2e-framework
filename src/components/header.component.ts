import { expect, type Locator, type Page } from '@playwright/test';

/**
 * Component object for the persistent header.
 *
 * The cart badge and burger menu appear on several pages, so they are modelled
 * once here and composed into each page object rather than duplicated. This is
 * the pattern that keeps a POM from rotting as an app grows.
 */
export class HeaderComponent {
  private readonly root: Locator;
  readonly cartLink: Locator;
  readonly cartBadge: Locator;
  private readonly burgerButton: Locator;
  private readonly logoutLink: Locator;

  constructor(page: Page) {
    this.root = page.locator('.primary_header');
    this.cartLink = page.locator('.shopping_cart_link');
    this.cartBadge = page.locator('.shopping_cart_badge');
    this.burgerButton = page.getByRole('button', { name: 'Open Menu' });
    this.logoutLink = page.getByRole('link', { name: 'Logout' });
  }

  /** Number of items in the cart. Returns 0 when the badge is absent. */
  async cartCount(): Promise<number> {
    if ((await this.cartBadge.count()) === 0) return 0;
    return Number((await this.cartBadge.innerText()).trim());
  }

  async expectCartCount(expected: number): Promise<void> {
    if (expected === 0) {
      await expect(this.cartBadge).toBeHidden();
      return;
    }
    await expect(this.cartBadge).toHaveText(String(expected));
  }

  async openCart(): Promise<void> {
    await this.cartLink.click();
  }

  async logout(): Promise<void> {
    await this.burgerButton.click();
    await this.logoutLink.click();
  }

  async expectVisible(): Promise<void> {
    await expect(this.root).toBeVisible();
  }
}
