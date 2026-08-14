import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from './base.page';
import {
  HealingLog,
  resolveResilient,
  type LocatorStrategy,
} from '../support/self-healing';
import type { TestUser } from '../data/users';

/**
 * The login page, resolved through the self-healing layer instead of fixed locators.
 *
 * Each field declares a prioritised strategy chain: the semantic, intentional
 * locator first, then progressively more incidental fallbacks. If the team removes
 * a `data-test` attribute, this page keeps working via the accessible name or the
 * element id, and the run reports exactly which attribute moved.
 */
export class ResilientLoginPage extends BasePage {
  protected readonly path = '/';
  protected readonly pageMarker: Locator;

  readonly healingLog = new HealingLog();

  private static readonly username: LocatorStrategy[] = [
    { name: 'data-test id', build: (p) => p.getByTestId('username') },
    { name: 'placeholder text', build: (p) => p.getByPlaceholder('Username') },
    { name: 'element id', build: (p) => p.locator('#user-name') },
    { name: 'first text input in form', build: (p) => p.locator('form input[type="text"]') },
  ];

  private static readonly password: LocatorStrategy[] = [
    { name: 'data-test id', build: (p) => p.getByTestId('password') },
    { name: 'placeholder text', build: (p) => p.getByPlaceholder('Password') },
    { name: 'element id', build: (p) => p.locator('#password') },
    { name: 'input type', build: (p) => p.locator('input[type="password"]') },
  ];

  private static readonly submit: LocatorStrategy[] = [
    { name: 'data-test id', build: (p) => p.getByTestId('login-button') },
    { name: 'accessible role', build: (p) => p.getByRole('button', { name: /login/i }) },
    { name: 'element id', build: (p) => p.locator('#login-button') },
    { name: 'submit input', build: (p) => p.locator('input[type="submit"]') },
  ];

  constructor(page: Page) {
    super(page);
    this.pageMarker = page.locator('form');
  }

  private resolve(element: string, chain: readonly LocatorStrategy[]): Promise<Locator> {
    return resolveResilient(this.page, element, chain, { log: this.healingLog });
  }

  async login(username: string, password: string): Promise<void> {
    await (await this.resolve('username field', ResilientLoginPage.username)).fill(username);
    await (await this.resolve('password field', ResilientLoginPage.password)).fill(password);
    await (await this.resolve('login button', ResilientLoginPage.submit)).click();
  }

  async loginAs(user: TestUser): Promise<void> {
    await this.login(user.username, user.password);
  }

  /** Fails the test if drift was silently absorbed without being reported. */
  async expectHealingReported(): Promise<void> {
    expect(this.healingLog.count, 'drift should be recorded as telemetry').toBeGreaterThan(0);
  }
}
