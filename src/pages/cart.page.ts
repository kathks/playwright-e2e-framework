import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from './base.page';
import { HeaderComponent } from '../components/header.component';
import type { ProductName } from '../data/products';

export class CartPage extends BasePage {
  protected readonly path = '/cart.html';

  readonly header: HeaderComponent;
  readonly lineItems: Locator;
  readonly checkoutButton: Locator;
  readonly continueShoppingButton: Locator;
  protected readonly pageMarker: Locator;

  constructor(page: Page) {
    super(page);
    this.header = new HeaderComponent(page);
    this.lineItems = page.locator('.cart_item');
    this.checkoutButton = page.getByTestId('checkout');
    this.continueShoppingButton = page.getByTestId('continue-shopping');
    this.pageMarker = page.getByText('Your Cart', { exact: true });
  }

  private line(name: ProductName): Locator {
    return this.lineItems.filter({ hasText: name });
  }

  async lineItemCount(): Promise<number> {
    return this.lineItems.count();
  }

  async productNames(): Promise<string[]> {
    return this.lineItems.locator('.inventory_item_name').allInnerTexts();
  }

  async quantityOf(name: ProductName): Promise<number> {
    return Number((await this.line(name).locator('.cart_quantity').innerText()).trim());
  }

  async removeItem(name: ProductName): Promise<void> {
    await this.line(name).getByRole('button', { name: 'Remove' }).click();
    await expect(this.line(name)).toHaveCount(0);
  }

  async expectContains(...names: ProductName[]): Promise<void> {
    for (const name of names) {
      await expect(this.line(name)).toBeVisible();
    }
  }

  async proceedToCheckout(): Promise<void> {
    await this.checkoutButton.click();
  }
}
