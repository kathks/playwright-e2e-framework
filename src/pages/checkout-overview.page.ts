import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from './base.page';
import type { ProductName } from '../data/products';

/** Step 2 of checkout: order review and price breakdown. */
export class CheckoutOverviewPage extends BasePage {
  protected readonly path = '/checkout-step-two.html';

  readonly lineItems: Locator;
  readonly subtotalLabel: Locator;
  readonly taxLabel: Locator;
  readonly totalLabel: Locator;
  readonly finishButton: Locator;
  protected readonly pageMarker: Locator;

  constructor(page: Page) {
    super(page);
    this.lineItems = page.locator('.cart_item');
    this.subtotalLabel = page.locator('.summary_subtotal_label');
    this.taxLabel = page.locator('.summary_tax_label');
    this.totalLabel = page.locator('.summary_total_label');
    this.finishButton = page.getByTestId('finish');
    this.pageMarker = page.getByText('Checkout: Overview', { exact: true });
  }

  async subtotal(): Promise<number> {
    return BasePage.toAmount(await this.subtotalLabel.innerText());
  }

  async tax(): Promise<number> {
    return BasePage.toAmount(await this.taxLabel.innerText());
  }

  async total(): Promise<number> {
    return BasePage.toAmount(await this.totalLabel.innerText());
  }

  async expectContains(...names: ProductName[]): Promise<void> {
    for (const name of names) {
      await expect(this.lineItems.filter({ hasText: name })).toBeVisible();
    }
  }

  async finish(): Promise<void> {
    await this.finishButton.click();
  }
}
