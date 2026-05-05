# griddy-web-portal

The first consumer-facing client for the [Griddy](https://github.com/Thistle-Grow-Software/all-things-griddy) platform — a web portal for authenticated coaches, scouts, and media to browse stats and watch game film.

For v1 scope, non-goals, and stack rationale, see the [Architecture Decision Records](docs/adr/README.md). The full unified docs site is at [docs.thistlegrow.software](https://docs.thistlegrow.software).

## What v1 does

1. Authenticated sign-in via Clerk.
2. Browse teams, players, and games across NFL, NCAA FBS, UFL, and CFL for available seasons.
3. Build flexible filter queries against stats data and export results as CSV/Excel.
4. Play available game film on a game detail page (basic playback — no annotation-driven filtering yet).

For the full v1 scope and explicit non-goals, see Jira **TGF-321** ("Griddy Web Viewing Portal v1").

## Local development

### Prerequisites

- **Node.js 24.x** — pinned via `.nvmrc` / `.node-version`. Install via [pnpm](https://pnpm.io/cli/env#use)
- **pnpm 10.x** — easiest path is via the [standalone script](https://pnpm.io/installation#using-a-standalone-script).

  ```bash
  curl -fsSL https://get.pnpm.io/install.sh | sh -
  ```

### Getting started

```bash
git clone git@github.com:Thistle-Grow-Software/griddy-web-portal.git
cd griddy-web-portal
pnpm install
pnpm dev          # http://localhost:5173
```

The dev server has HMR enabled. Edit anything under `src/` and the browser updates without a refresh.

### Available scripts

| Command | What it does |
| --- | --- |
| `pnpm dev` | Start the Vite dev server with HMR. |
| `pnpm build` | Type-check and build a production bundle to `dist/`. |
| `pnpm preview` | Serve the production build locally for smoke-testing. |
| `pnpm lint` | Run Biome's linter. |
| `pnpm format` | Run Biome's formatter, writing changes in place. |
| `pnpm format:check` | Run Biome's formatter in check-only mode (CI). |
| `pnpm check` | Run Biome's combined lint + format check (write mode off). |
| `pnpm typecheck` | Run `tsc -b --noEmit` across the project references. |
| `pnpm test` | Run the Vitest suite once. |
| `pnpm test:watch` | Run Vitest in watch mode. |
| `pnpm test:coverage` | Run tests with V8 coverage reporting. |
| `pnpm test:e2e` | Run the Playwright E2E suite (boots `pnpm preview` automatically). |
| `pnpm test:e2e:ui` | Open Playwright's UI mode for interactive debugging. |

### Environment variables

Copy `.env.example` to `.env.local` and fill in values for any required variables before running `pnpm dev`.

| Variable | Status | Purpose |
| --- | --- | --- |
| `VITE_CLERK_PUBLISHABLE_KEY` | **Required** | Clerk publishable key for the configured instance (dev/staging/prod). The app throws at startup if missing. Grab it from the Clerk Dashboard → API Keys. |
| `VITE_SENTRY_DSN` | Optional | Sentry DSN. SDK no-ops when absent — leave blank locally to avoid spamming Sentry. |
| `VITE_API_BASE_URL` | Planned | Griddy API origin (introduced with the OpenAPI client story). |
| `CLERK_PUBLISHABLE_KEY` | E2E only | Clerk **test** publishable key — used by Playwright's global setup to mint testing tokens. Never the production key. |
| `CLERK_SECRET_KEY` | E2E only | Clerk **test** secret key — Playwright global setup only. Never the production key. |
| `E2E_CLERK_USER_USERNAME` | E2E only | Pre-provisioned test user in the Clerk test instance. Smoke spec skips when unset. |
| `E2E_CLERK_USER_PASSWORD` | E2E only | Password for the pre-provisioned test user. |

Anything Vite-exposed must be prefixed with `VITE_`. Server-only secrets do not exist in this app — the portal is browser-only and talks to the Griddy API directly. CI also reads `SENTRY_AUTH_TOKEN` (Secret), `SENTRY_ORG`, and `SENTRY_PROJECT` (Variables) on the build step to upload source maps; they are never bundled into the client.

## Testing

Three layers of tests live in this repo:

| Layer | Tooling | Location | Runs on |
| --- | --- | --- | --- |
| Unit + component | Vitest + React Testing Library | `src/**/*.test.ts(x)` | every PR |
| API mocking | [MSW](https://mswjs.io) (Node interceptor) | `src/mocks/` | every PR (via Vitest) |
| End-to-end | Playwright | `e2e/*.spec.ts` | pushes to `main` and manual dispatch (see `.github/workflows/e2e.yml`) |

### Unit + component tests

Use the wrappers in `src/test-utils.tsx` rather than `@testing-library/react` directly — they
provide a fresh `QueryClient` and the same Mantine providers the app uses at runtime.

```tsx
import { renderWithProviders, screen, userEvent } from "@/test-utils";

renderWithProviders(<MyComponent />);
```

Components that use Clerk hooks should mock `@clerk/react` per-file with `vi.mock`. The
`renderWithProviders` wrapper deliberately does not wrap with `<ClerkProvider>` because
real Clerk requires network access; mocking the hooks keeps tests hermetic.

### MSW (Mock Service Worker)

API requests in tests are mocked at the network layer by MSW. Default handlers live in
`src/mocks/handlers.ts`; the Node server is started for the whole test run from
`vitest.setup.ts` with `onUnhandledRequest: "error"` — any fetch without a matching
handler **fails the test**, so missing mocks surface immediately.

Per-test overrides use `server.use(...)`:

```ts
import { HttpResponse, http } from "msw";
import { server } from "@/mocks/server";

server.use(
  http.get("/api/teams/", () => HttpResponse.json({ count: 0, results: [] })),
);
```

Handlers run between `beforeAll` and `afterAll`; `afterEach` resets handler overrides
back to the defaults declared in `handlers.ts`.

### End-to-end tests

Playwright drives a real Chromium browser against the production preview build
(`pnpm build && pnpm preview`). Authentication uses Clerk's testing tokens — the E2E suite
exchanges `CLERK_PUBLISHABLE_KEY` + `CLERK_SECRET_KEY` for short-lived testing tokens via
`@clerk/testing/playwright`, so specs sign in without an interactive OAuth flow.

Set these to run E2E locally (use the **test** Clerk instance, never production):

```bash
# In .env.local — never commit values
CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
E2E_CLERK_USER_USERNAME=playwright-smoke@example.com
E2E_CLERK_USER_PASSWORD=...
```

When these are absent the smoke spec skips itself rather than failing, so a misconfigured
environment doesn't show up as a test break.

E2E only runs in CI on `main` pushes — too slow to gate every PR — and uploads
`playwright-report/` (always) and `test-results/` (on failure) as workflow artifacts.

## Project layout

```
griddy-web-portal/
├── biome.json              # Biome lint + format configuration
├── docs/                   # Documentation surface (aggregated by griddy-docs)
│   ├── adr/                # Architecture Decision Records
│   └── index.md            # Docs site landing page
├── index.html              # Vite HTML entry point
├── package.json
├── pnpm-lock.yaml
├── public/                 # Static assets served as-is (created on demand)
├── src/
│   ├── App.tsx             # Top-level component
│   ├── App.test.tsx        # Sanity test for the scaffold
│   ├── index.css           # Global styles (placeholder until Mantine lands)
│   ├── main.tsx            # React entry point
│   └── vite-env.d.ts       # Vite ambient types
├── tsconfig.json           # Project references entry
├── tsconfig.app.json       # App TS config (strict, path alias `@/` → `src/`)
├── tsconfig.node.json      # Build-tooling TS config
├── vite.config.ts          # Vite + Vitest configuration
└── vitest.setup.ts         # Test-environment setup (jest-dom matchers)
```

Feature stories under TGF-321 will introduce additional directories (`src/api/`, `src/routes/`, `src/components/`, etc.) as needed. Pre-creating empty directories is left out deliberately — git doesn't track them anyway, and conventions are easier to enforce when they appear with real code.

## Stack reference

| Concern | Choice |
| --- | --- |
| Framework | React + Vite (no meta-framework) |
| Routing | TanStack Router |
| Server state | TanStack Query |
| Client state | Zustand |
| UI kit | Mantine |
| Forms / validation | React Hook Form + Zod |
| Charts | Recharts |
| API client | Generated from DRF OpenAPI via `openapi-ts` |
| Auth | Clerk |
| Testing | Vitest + Testing Library + Playwright |
| Lint / format | Biome |
| Package manager | pnpm |
| Observability | Sentry (errors) + PostHog (product analytics) |
| Deployment | Cloudflare Pages |

For the rationale behind each choice, see the [Architecture Decision Records](docs/adr/README.md).

## Contributing

This repo follows the same conventions as the rest of the Griddy platform:

- **Conventional Commits** (`feat(GAM #123): ...`, `fix(GAM #123): ...`).
- **Branch naming**: `<type>/TGF-<num>-<description>`.
- **PR title** matches the commit message format.
- **PR body** includes a `Closes #<num>` footer when closing an issue.

## Repository status

The application scaffold (this commit) is the first executable code. Application features land in follow-up Jira stories under the **TGF-321** epic.

## License

[MIT](LICENSE)
