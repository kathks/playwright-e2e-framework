import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from './base.page';
import { HeaderComponent } from '../components/header.component';
import type { ProductName } from '../data/products';

export type SortOption = 'az' | 'za' | 'lohi' | 'hilo';

export class InventoryPage extends BasePage {
  protected readonly path = '/inventory.html';

  readonly header: HeaderComponent;
  readonly items: Locator;
  readonly sortDropdown: Locator;
  protected readonly pageMarker: Locator;

  constructor(page: Page) {
    super(page);
    this.header = new HeaderComponent(page);
    this.items = page.locator('.inventory_item');
    this.sortDropdown = page.getByTestId('product-sort-container');
    this.pageMarker = page.getByText('Products', { exact: true });
  }

  /**
   * Scope actions to a single product card by its visible name instead of a
   * brittle index or generated id — the test reads like the user's intent.
   */
  private card(name: ProductName): Locator {
    return this.items.filter({ hasText: name });
  }

  async addToCart(...names: ProductName[]): Promise<void> {
    for (const name of names) {
      await this.card(name).getByRole('button', { name: 'Add to cart' }).click();
    }
  }

  async removeFromCart(name: ProductName): Promise<void> {
    await this.card(name).getByRole('button', { name: 'Remove' }).click();
  }

  async priceOf(name: ProductName): Promise<number> {
    const text = await this.card(name).locator('.inventory_item_price').innerText();
    return BasePage.toAmount(text);
  }

  async openProduct(name: ProductName): Promise<void> {
    await this.card(name).locator('.inventory_item_name').click();
  }

  async itemCount(): Promise<number> {
    return this.items.count();
  }

  async sortBy(option: SortOption): Promise<void> {
    await this.sortDropdown.selectOption(option);
  }

  async displayedNames(): Promise<string[]> {
    return this.items.locator('.inventory_item_name').allInnerTexts();
  }

  async displayedPrices(): Promise<number[]> {
    const raw = await this.items.locator('.inventory_item_price').allInnerTexts();
    return raw.map((text) => BasePage.toAmount(text));
  }

  /** The button label flips to "Remove" once an item is in the cart. */
  async expectItemAdded(name: ProductName): Promise<void> {
    await expect(this.card(name).getByRole('button', { name: 'Remove' })).toBeVisible();
  }
}
