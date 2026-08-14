import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from './base.page';
import type { TestUser } from '../data/users';

export class LoginPage extends BasePage {
  protected readonly path = '/';

  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly errorMessage: Locator;
  protected readonly pageMarker: Locator;

  constructor(page: Page) {
    super(page);
    this.usernameInput = page.getByTestId('username');
    this.passwordInput = page.getByTestId('password');
    this.loginButton = page.getByTestId('login-button');
    this.errorMessage = page.getByTestId('error');
    this.pageMarker = this.loginButton;
  }

  /** Fills the form and submits. Deliberately makes no success assertion — the
   *  caller decides whether it expected a happy or unhappy path. */
  async login(username: string, password: string): Promise<void> {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }

  async loginAs(user: TestUser): Promise<void> {
    await this.login(user.username, user.password);
  }

  async expectError(message: string): Promise<void> {
    await expect(this.errorMessage).toBeVisible();
    await expect(this.errorMessage).toContainText(message);
  }
}
