import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from './base.page';

/** Final step: order confirmation. */
export class OrderConfirmationPage extends BasePage {
  protected readonly path = '/checkout-complete.html';

  readonly confirmationHeader: Locator;
  readonly confirmationText: Locator;
  readonly backToProductsButton: Locator;
  protected readonly pageMarker: Locator;

  constructor(page: Page) {
    super(page);
    this.confirmationHeader = page.locator('.complete-header');
    this.confirmationText = page.locator('.complete-text');
    this.backToProductsButton = page.getByTestId('back-to-products');
    this.pageMarker = this.confirmationHeader;
  }

  async expectOrderPlaced(): Promise<void> {
    await expect(this.confirmationHeader).toHaveText(/thank you for your order/i);
    await expect(this.backToProductsButton).toBeVisible();
  }

  async backToProducts(): Promise<void> {
    await this.backToProductsButton.click();
  }
}
