# 🎭 Playwright E2E Framework — Page Object Model Reference

[![Playwright Tests](https://github.com/kathks/playwright-e2e-framework/actions/workflows/playwright.yml/badge.svg)](https://github.com/kathks/playwright-e2e-framework/actions/workflows/playwright.yml)
![Playwright](https://img.shields.io/badge/Playwright-2EAD33?logo=playwright&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-blue)

A production-shaped test automation framework built with **Playwright + TypeScript**, demonstrating the Page Object Model, component objects, fixture-based dependency injection, CI-gated execution — and a working **self-healing locator layer** that recovers from selector drift and reports every heal as telemetry.

It runs against **[saucedemo.com](https://www.saucedemo.com)** — a public demo storefront — so anyone can clone this repo and have a green suite in under two minutes. No VPN, no seeded database, no credentials to request.

---

## Quick start

```bash
git clone https://github.com/kathks/playwright-e2e-framework.git
cd playwright-e2e-framework
npm ci
npx playwright install --with-deps
npm test
```

| Command | What it does |
|---|---|
| `npm test` | Full suite, all browser projects |
| `npm run test:smoke` | Critical-path tests only (`@smoke`) — the PR gate |
| `npm run test:headed` | Watch it drive a real browser |
| `npm run test:ui` | Playwright's interactive UI mode — best for debugging |
| `npm run report` | Open the last HTML report |
| `npm run typecheck` | Type-check without running tests |

---

## What this demonstrates

| Concern | Approach taken |
|---|---|
| **Page Object Model** | Every page extends `BasePage`, which enforces a `path` and a `pageMarker` so navigation and readiness are uniform and no test contains a hard wait |
| **Component objects** | The header (cart badge, burger menu, logout) is modelled once in `HeaderComponent` and composed into the pages that use it, rather than duplicated per page |
| **Page decomposition** | Checkout is split into `CheckoutDetailsPage` → `CheckoutOverviewPage` → `OrderConfirmationPage`, mirroring the real user journey instead of one god-object |
| **Dependency injection** | Custom fixtures construct page objects lazily; tests declare what they need in the signature. A `loggedIn` fixture supplies an authenticated session so no test repeats login steps |
| **Data-driven testing** | Negative login cases are a data array, so adding a scenario is a one-line change and still produces an independent result in the report |
| **Business-rule assertions** | The E2E journey verifies subtotal = Σ item prices, tax = 8% of subtotal, total = subtotal + tax — not merely that a page rendered |
| **Readable reporting** | `test.step` groups the journey into stakeholder-legible phases so a failure names the phase, not just a line number |
| **Test tagging** | `@smoke`, `@regression`, `@e2e` allow a fast PR gate and a deeper scheduled run from one suite |
| **Self-healing locators** | Elements resolve from a prioritised strategy chain; a fallback is recorded as a healing event and attached to the report, so drift becomes visible telemetry instead of silent tolerance (`src/support/self-healing.ts`) |
| **Cross-browser** | Chromium, Firefox, WebKit and mobile Chrome as separate projects in a CI matrix |
| **Failure diagnostics** | Trace on first retry, screenshot and video on failure, uploaded as CI artefacts |
| **Config as environment** | `BASE_URL` and credentials come from environment variables, with the public demo values as fallback |

---

## Project structure

```
.
├── .github/workflows/playwright.yml   # Smoke gate → cross-browser matrix → artefacts
├── playwright.config.ts               # Timeouts, retries, reporters, browser projects
├── tsconfig.json                      # Strict mode + @pages / @data / @fixtures aliases
├── src
│   ├── components
│   │   └── header.component.ts        # Reusable component object
│   ├── data
│   │   ├── products.ts                # Product names, customer details, tax rate
│   │   └── users.ts                   # Personas + negative-path credential sets
│   ├── fixtures
│   │   └── pages.fixture.ts           # Page object injection + `loggedIn` state fixture
│   ├── support
│   │   └── self-healing.ts            # ⭐ Resilient locator chain + healing telemetry
│   └── pages
│       ├── base.page.ts               # Shared navigation, readiness, currency parsing
│       ├── login.page.ts
│       ├── inventory.page.ts
│       ├── cart.page.ts
│       ├── checkout-details.page.ts
│       ├── checkout-overview.page.ts
│       ├── order-confirmation.page.ts
│       ├── resilient-login.page.ts    # Login resolved through the healing layer
│       └── index.ts
└── tests
    ├── authentication.spec.ts         # Happy path, locked-out user, data-driven negatives
    ├── cart.spec.ts                   # Badge state, add/remove, persistence
    ├── catalogue-sorting.spec.ts      # Sort-order verification
    ├── checkout-journey.e2e.spec.ts   # ⭐ The full purchase journey
    └── self-healing.spec.ts           # ⭐ Proves the healing layer under injected drift
```

---

## The self-healing layer

Selector drift is the biggest maintenance cost in a UI suite: a developer renames a class or drops a `data-test` attribute, and a green suite goes red for a reason that has nothing to do with product behaviour.

`resolveResilient()` resolves an element from a **prioritised strategy chain** instead of a single selector — the semantic, intentional locator first, then progressively more incidental fallbacks:

```ts
private static readonly username: LocatorStrategy[] = [
  { name: 'data-test id',    build: (p) => p.getByTestId('username') },
  { name: 'placeholder text', build: (p) => p.getByPlaceholder('Username') },
  { name: 'element id',       build: (p) => p.locator('#user-name') },
];
```

Three rules keep this from becoming a way to hide problems:

1. **Healing is observable.** Every fallback is recorded in a `HealingLog` and pushed as a `self-healed` annotation, so the run tells you exactly which attribute moved. A heal nobody sees is debt accruing quietly.
2. **Healing never invents behaviour.** It re-finds the same element. It does not guess at a different one, and it does not swallow genuine regressions.
3. **Exhausting the chain is a real failure.** The error names every strategy it tried and states plainly that this is a defect, not drift.

`tests/self-healing.spec.ts` proves it two ways: deterministically against a controlled page where the primary locator is known to be absent, and against the live application with `data-test` attributes stripped at runtime — the login journey completes anyway, and the drift is reported.

`StrategySuggester` is the documented extension point where an LLM-backed step slots in to propose new strategies from the live DOM. A suggestion is verified against the page before use and queued as a diff for human review — never applied blind.

---

## Design decisions worth defending

**Locators follow the user, not the DOM.** Product actions are scoped to a card filtered by its visible name (`.filter({ hasText: name })`), then the button is found by role. When a developer changes a CSS class or reorders the grid, these tests keep passing — which is the entire point of a maintainable suite.

**No hard waits, anywhere.** Readiness is expressed as an assertion on a `pageMarker` element, which uses Playwright's auto-retry. `waitForTimeout` does not appear in this codebase.

**Page objects don't assert success on actions.** `login()` submits the form and stops. Whether that should have succeeded is the test's business, so the same method serves both positive and negative cases.

**Tests never construct page objects.** That coupling lives in one fixtures file. Adding a page object to the framework never requires editing a test.

**Retries exist for infrastructure, not for flake.** CI retries twice to absorb network noise; a test that only passes on retry is treated as a defect with an owner, not as an acceptable cost.

---

## Layer strategy

This repo intentionally covers the UI layer, which is the thinnest layer of a healthy pyramid. In a real product I'd pair it with:

- **API/contract tests** for business logic and boundary conditions — faster and far more stable
- **Unit tests** owned by developers, gating the PR before this suite runs
- **A small UI set** covering only journeys that must work through the browser, exactly like the one here

The value of a UI framework is not how many tests it holds; it's how quickly the ones it holds tell you the truth.

---

## Notes

- Test credentials here are the public demo account documented on saucedemo.com's own login page. `TEST_PASSWORD` is still read from the environment to demonstrate the correct pattern.
- Target a different environment with `BASE_URL=https://your-app.example.com npm test`.

## License

MIT — reuse freely.
