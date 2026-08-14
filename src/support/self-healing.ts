import { test, type Locator, type Page } from '@playwright/test';

/**
 * SELF-HEALING LOCATOR LAYER
 * ==========================
 * Selector drift is the single biggest source of maintenance cost in UI suites:
 * a developer renames a class or drops a test id, and a green suite goes red for
 * a reason that has nothing to do with product behaviour.
 *
 * This layer resolves an element from a *prioritised chain* of strategies rather
 * than a single selector. The first strategy that attaches wins. If a lower-priority
 * strategy had to be used, the resolution is recorded as a healing event and
 * attached to the test run, so drift becomes visible telemetry instead of silent
 * tolerance — the suite keeps running, and the team still gets told what moved.
 *
 * Design principles:
 *  1. Healing is observable. A heal that nobody sees is technical debt accruing quietly.
 *  2. Healing never invents behaviour. It re-finds the same element; it does not
 *     guess at a different one or swallow genuine regressions.
 *  3. Fail loudly at the end of the chain. Exhausting every strategy is a real failure
 *     and reports every strategy it tried.
 *
 * The `suggestStrategy` hook is where an LLM-backed suggestion step slots in for
 * teams that want the chain to propose new strategies from the live DOM rather
 * than only consuming a hand-written list.
 */

export interface LocatorStrategy {
  /** Human-readable name that appears in healing telemetry, e.g. "data-test id". */
  readonly name: string;
  readonly build: (page: Page) => Locator;
}

export interface HealingEvent {
  readonly element: string;
  readonly failedStrategies: readonly string[];
  readonly healedWith: string;
  readonly at: string;
}

/** In-memory healing telemetry for the current worker. Assert on it in tests. */
export class HealingLog {
  private readonly events: HealingEvent[] = [];

  record(event: HealingEvent): void {
    this.events.push(event);
  }

  get all(): readonly HealingEvent[] {
    return this.events;
  }

  get count(): number {
    return this.events.length;
  }

  forElement(element: string): readonly HealingEvent[] {
    return this.events.filter((event) => event.element === element);
  }

  /** Markdown summary suitable for attaching to a CI report or a PR comment. */
  toReport(): string {
    if (this.events.length === 0) return 'No healing events — all primary locators resolved.';
    return this.events
      .map(
        (e) =>
          `- **${e.element}**: \`${e.failedStrategies.join('` → `')}\` failed, healed with \`${e.healedWith}\``,
      )
      .join('\n');
  }
}

export interface ResolveOptions {
  /** How long to give each strategy before moving down the chain. */
  readonly perStrategyTimeout?: number;
  readonly log?: HealingLog;
}

/**
 * Walk the strategy chain and return the first locator that attaches.
 * Records a healing event whenever a fallback was required.
 */
export async function resolveResilient(
  page: Page,
  element: string,
  strategies: readonly LocatorStrategy[],
  options: ResolveOptions = {},
): Promise<Locator> {
  const timeout = options.perStrategyTimeout ?? 2_000;
  const failed: string[] = [];

  for (const strategy of strategies) {
    const locator = strategy.build(page).first();
    try {
      await locator.waitFor({ state: 'attached', timeout });

      if (failed.length > 0) {
        const event: HealingEvent = {
          element,
          failedStrategies: [...failed],
          healedWith: strategy.name,
          at: new Date().toISOString(),
        };
        options.log?.record(event);
        annotate(event);
      }

      return locator;
    } catch {
      failed.push(strategy.name);
    }
  }

  throw new Error(
    `Self-healing exhausted for "${element}". Tried ${strategies.length} strategies: ${failed.join(', ')}. ` +
      `This is a genuine failure, not drift — the element is absent or the page never rendered.`,
  );
}

/** Surfaces the heal in the HTML report. No-op outside a running test. */
function annotate(event: HealingEvent): void {
  try {
    test.info().annotations.push({
      type: 'self-healed',
      description: `${event.element}: ${event.failedStrategies.join(' → ')} failed, healed with "${event.healedWith}"`,
    });
  } catch {
    // Called outside a test context — telemetry still lands in the HealingLog.
  }
}

/**
 * Extension point for AI-assisted healing.
 *
 * In the production version of this pattern the chain is not exhausted before
 * asking for help: the DOM around the expected element is serialised and an LLM
 * proposes a candidate strategy, which is then verified against the live page
 * before being used and queued as a suggested code change for review.
 *
 * A suggestion is never applied blind. Verify, use, then propose the diff to a human.
 */
export type StrategySuggester = (
  page: Page,
  element: string,
  failedStrategies: readonly string[],
) => Promise<LocatorStrategy | null>;
