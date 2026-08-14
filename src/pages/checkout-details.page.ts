import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from './base.page';
import type { CustomerDetails } from '../data/products';

/** Step 1 of checkout: customer information. */
export class CheckoutDetailsPage extends BasePage {
  protected readonly path = '/checkout-step-one.html';

  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly postalCodeInput: Locator;
  readonly continueButton: Locator;
  readonly cancelButton: Locator;
  readonly errorMessage: Locator;
  protected readonly pageMarker: Locator;

  constructor(page: Page) {
    super(page);
    this.firstNameInput = page.getByTestId('firstName');
    this.lastNameInput = page.getByTestId('lastName');
    this.postalCodeInput = page.getByTestId('postalCode');
    this.continueButton = page.getByTestId('continue');
    this.cancelButton = page.getByTestId('cancel');
    this.errorMessage = page.getByTestId('error');
    this.pageMarker = page.getByText('Checkout: Your Information', { exact: true });
  }

  async fillDetails(customer: CustomerDetails): Promise<void> {
    await this.firstNameInput.fill(customer.firstName);
    await this.lastNameInput.fill(customer.lastName);
    await this.postalCodeInput.fill(customer.postalCode);
  }

  async submit(): Promise<void> {
    await this.continueButton.click();
  }

  async fillAndContinue(customer: CustomerDetails): Promise<void> {
    await this.fillDetails(customer);
    await this.submit();
  }

  async expectError(message: string): Promise<void> {
    await expect(this.errorMessage).toContainText(message);
  }
}
