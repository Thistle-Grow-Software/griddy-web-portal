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

### Environment variables

Copy `.env.example` to `.env.local` and fill in values for any required variables before running `pnpm dev`.

| Variable | Status | Purpose |
| --- | --- | --- |
| `VITE_CLERK_PUBLISHABLE_KEY` | **Required** | Clerk publishable key for the configured instance (dev/staging/prod). The app throws at startup if missing. Grab it from the Clerk Dashboard → API Keys. |
| `VITE_API_BASE_URL` | Planned | Griddy API origin (introduced with the OpenAPI client story). |
| `VITE_SENTRY_DSN` | Planned | Sentry DSN (introduced with the observability story). |
| `VITE_POSTHOG_KEY` | Planned | PostHog API key (introduced with the observability story). |

Anything Vite-exposed must be prefixed with `VITE_`. Server-only secrets do not exist in this app — the portal is browser-only and talks to the Griddy API directly.

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
