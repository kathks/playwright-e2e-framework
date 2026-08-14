import { expect, type Locator, type Page } from '@playwright/test';

/**
 * Shared behaviour for every page object.
 *
 * Subclasses declare two things:
 *  - `path`       : where the page lives, so `goto()` is uniform everywhere
 *  - `pageMarker` : one element that proves the page has actually rendered,
 *                   which removes the need for arbitrary waits in tests
 */
export abstract class BasePage {
  protected abstract readonly path: string;
  protected abstract readonly pageMarker: Locator;

  constructor(protected readonly page: Page) {}

  /** Navigate straight to this page and wait until it is genuinely ready. */
  async open(): Promise<void> {
    await this.page.goto(this.path);
    await this.expectLoaded();
  }

  /** Assertion-based readiness check — auto-retries until the marker appears. */
  async expectLoaded(): Promise<void> {
    await expect(this.pageMarker).toBeVisible();
  }

  async expectUrlToContain(fragment: string): Promise<void> {
    await expect(this.page).toHaveURL(new RegExp(fragment));
  }

  get title(): Promise<string> {
    return this.page.title();
  }

  /** Parses "$29.99" into 29.99 so tests can assert on maths, not strings. */
  protected static toAmount(text: string): number {
    const match = text.match(/\d+\.\d{2}/);
    if (!match) throw new Error(`Could not parse a currency amount from: "${text}"`);
    return Number(match[0]);
  }
}
