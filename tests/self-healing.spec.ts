import { test, expect } from '@fixtures/pages.fixture';
import { ResilientLoginPage } from '@pages/index';
import { HealingLog, resolveResilient } from '../src/support/self-healing';
import { users } from '@data/users';

/**
 * Proves the healing layer actually heals, in two ways:
 *
 *  1. Deterministically, against a controlled page where the primary locator is
 *     known to be absent — no network, no flake, exact assertions on telemetry.
 *  2. Against the live application with simulated selector drift injected at
 *     runtime, showing the real login journey survives a developer removing
 *     the attribute the suite depends on.
 */
test.describe('Self-healing locators', { tag: '@healing' }, () => {
  test('falls back down the strategy chain and records the heal @healing', async ({ page }) => {
    const log = new HealingLog();

    // A form whose `data-test` attribute has been "removed" by a developer.
    await page.setContent(`
      <form>
        <input id="user-name" placeholder="Username" type="text" />
      </form>
    `);

    const field = await resolveResilient(
      page,
      'username field',
      [
        { name: 'data-test id', build: (p) => p.getByTestId('username') },
        { name: 'placeholder text', build: (p) => p.getByPlaceholder('Username') },
      ],
      { log, perStrategyTimeout: 500 },
    );

    await field.fill('healed_input');
    await expect(field).toHaveValue('healed_input');

    expect(log.count, 'the fallback should be recorded').toBe(1);
    expect(log.all[0]).toMatchObject({
      element: 'username field',
      failedStrategies: ['data-test id'],
      healedWith: 'placeholder text',
    });
  });

  test('throws a clear diagnostic when every strategy is exhausted @healing', async ({ page }) => {
    await page.setContent('<main>an empty page</main>');

    await expect(
      resolveResilient(
        page,
        'checkout button',
        [
          { name: 'data-test id', build: (p) => p.getByTestId('checkout') },
          { name: 'accessible role', build: (p) => p.getByRole('button', { name: 'Checkout' }) },
        ],
        { perStrategyTimeout: 300 },
      ),
    ).rejects.toThrow(/Self-healing exhausted for "checkout button".*genuine failure/s);
  });

  test('the login journey survives selector drift on the live app @healing @e2e', async ({
    page,
    inventoryPage,
  }) => {
    // Simulate drift: prevent data-test attributes from existing at all.
    // This is done by:
    // 1. Overriding Element.prototype.setAttribute to ignore data-test
    // 2. Stripping any that exist immediately on page load
    // 3. Continuous stripping via MutationObserver and interval as safety net
    await page.addInitScript(() => {
      // Override setAttribute to prevent data-test from being added
      const originalSetAttribute = Element.prototype.setAttribute;
      Element.prototype.setAttribute = function (name: string, value: string): void {
        if (name !== 'data-test') {
          originalSetAttribute.call(this, name, value);
        }
      };

      // Override setAttribute on SVGElement too (some frameworks might use it differently)
      if (typeof SVGElement !== 'undefined') {
        const originalSVGSetAttribute = SVGElement.prototype.setAttribute;
        SVGElement.prototype.setAttribute = function (name: string, value: string): void {
          if (name !== 'data-test') {
            originalSVGSetAttribute.call(this, name, value);
          }
        };
      }

      const strip = (): void => {
        document
          .querySelectorAll('[data-test]')
          .forEach((el) => el.removeAttribute('data-test'));
      };

      // Strip immediately, before anything renders
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', strip, { once: true });
      }
      strip();

      // Also strip after a tiny delay in case of timing edge cases
      setTimeout(strip, 10);
      setTimeout(strip, 50);
      setTimeout(strip, 100);

      // Watch for any data-test attributes being added dynamically (shouldn't happen now)
      const observer = new MutationObserver(() => {
        strip();
      });

      observer.observe(document.documentElement, {
        subtree: true,
        attributes: true,
        attributeFilter: ['data-test'],
      });

      // Fallback: strip every 200ms for the duration of the test
      setInterval(strip, 200);
    });

    const loginPage = new ResilientLoginPage(page);
    await loginPage.open();
    await loginPage.loginAs(users.standard);

    // The primary locators are gone, and the journey still completes.
    await inventoryPage.expectLoaded();
    await inventoryPage.expectUrlToContain('inventory.html');

    // ...and the drift was reported rather than silently absorbed.
    await loginPage.expectHealingReported();
    await test.info().attach('healing-report.md', {
      body: loginPage.healingLog.toReport(),
      contentType: 'text/markdown',
    });
  });
});
