# ADR-0007: Tooling baseline — pnpm + Biome + Vitest + Playwright

## Status

Accepted.

## Context

A new repo needs an explicit baseline for package management,
linting, formatting, unit testing, and end-to-end testing. The
JavaScript ecosystem offers several reasonable choices for each
slot, and the cost of getting them wrong is "everyone touching
this repo for the next two years pays the tax." Worth picking
deliberately.

## Decision

Adopt the following baseline:

* **Package manager:** `pnpm`
* **Lint + format:** `Biome`
* **Unit / component tests:** `Vitest` + `@testing-library/react`
* **End-to-end tests:** `Playwright`

These choices apply to v1 and any subsequent work in this repo
unless a future ADR supersedes this one.

## Consequences

* **Faster installs and less disk usage.** `pnpm`'s content-addressed
  store means a single copy of each dependency on disk, regardless of
  how many projects use it. Cold installs are measurably faster than
  npm; warm installs are dramatically faster.
* **One linting/formatting tool, one config.** `Biome` replaces
  ESLint + Prettier + their respective plugin ecosystems. A single
  binary, a single config file, a single set of rules, no
  end-of-quarter "is the rule about hooks dependencies coming from
  ESLint or `eslint-plugin-react-hooks`?" arguments.
* **Vitest is the natural Vite-aligned test runner.** Same config
  and module resolution as the dev server; tests "just work" with
  the same TypeScript/JSX setup.
* **Playwright is the modern E2E choice.** Cross-browser by default,
  reliable selector engine, built-in trace/video recording, test
  isolation that's actually isolation.
* **CI surface is small.** Three commands cover everything:
  `pnpm install`, `pnpm test`, `pnpm test:e2e`.
* **Migration cost off these defaults is non-trivial.** If a future
  contributor wants to switch (e.g. to Bun, to ESLint, to Jest),
  it's a coordinated effort. That's intentional — these decisions
  are meant to stick.

## Alternatives considered

### Package manager

**npm.** The default. Slower than pnpm, no content-addressed
store, but ubiquitous. Rejected on speed and disk-usage grounds.

**yarn (v3+ / Berry).** Workspace support is excellent but the
v1 → v2 migration burned the community; the ecosystem is split
between yarn classic and yarn berry. Rejected on confusion grounds
— pnpm has converged on the same wins (workspaces, fast installs)
without the bifurcation.

**Bun.** Promising and very fast, but ecosystem maturity is still
catching up — some packages still don't install or run cleanly
under Bun, and CI image support is less mature than pnpm. Worth
re-evaluating in 12 months.

### Lint + format

**ESLint + Prettier.** The historical default. Rejected on the
"two tools, two configs, two velocities of upgrades" grounds.
Biome's rule coverage is now wide enough for our needs and the
single-tool ergonomics win.

**ESLint alone (with `--fix` for formatting).** Rejected. ESLint's
formatting story is much weaker than Prettier's; using ESLint
alone means picking from a worse menu of formatting options.

### Unit testing

**Jest.** The legacy default. Rejected because the Vite/Vitest
duplication of config is annoying — Jest needs its own
TypeScript/JSX setup that has to track Vite's, and the resulting
"works in dev but not in tests" failures are exactly what we
don't want.

**Mocha + chai.** Rejected on momentum grounds — most React
ecosystem tooling assumes Jest-shaped APIs (`describe`, `it`,
matchers); Vitest implements those compatibly. Mocha would mean
writing more glue.

### End-to-end testing

**Cypress.** Strong DX but the chromium-only architecture and
test-isolation model (tests share a single browser instance and
mutate global state) bite at scale. Playwright's per-test
fresh-context model is meaningfully more reliable.

**Selenium / WebdriverIO.** Rejected on DX grounds. We're not
building cross-browser regression coverage on the scale that
justifies their complexity.

## Reference

* TGF-321 stack table.
