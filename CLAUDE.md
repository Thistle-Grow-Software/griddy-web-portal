# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project context

`griddy-web-portal` is the consumer-facing web client for the Griddy platform — a portal for authenticated coaches, scouts, and media to browse stats and watch game film across NFL, NCAA FBS, UFL, and CFL.

The repository currently contains the v1 scaffold only (Vite + React + TypeScript). Application features land in follow-up Jira stories under epic **TGF-321**. Architecture decisions are documented in `docs/adr/` — read those before changing the stack or making cross-cutting choices.

The wider monorepo (`all-things-griddy/CLAUDE.md`) has its own conventions; this app is browser-only and talks to the Griddy API directly (no server component).

## Commands

Use `pnpm` (10.x) with Node 24.x — both pinned via `engines`, `.nvmrc`, and `.node-version`.

```bash
pnpm install
pnpm dev              # Vite dev server, HMR, http://localhost:5173
pnpm build            # tsc -b project references, then vite build → dist/
pnpm preview          # serve the production build for smoke-testing
pnpm typecheck        # tsc -b --noEmit across project references
pnpm lint             # Biome linter
pnpm format           # Biome formatter, in-place
pnpm format:check     # Biome formatter, check-only (CI)
pnpm check            # Biome combined lint + format check
pnpm test             # Vitest, single run
pnpm test:watch       # Vitest, watch mode
pnpm test:coverage    # Vitest with V8 coverage
```

Run a single test file: `pnpm test src/App.test.tsx`. Filter by name: `pnpm test -t "renders heading"`.

## Architecture notes

### TypeScript project references

`tsconfig.json` is a solution file with two references:

- `tsconfig.app.json` — application code under `src/` (strict, `jsx: react-jsx`, `verbatimModuleSyntax`, `noUnusedLocals/Parameters`).
- `tsconfig.node.json` — build tooling (`vite.config.ts`, etc.).

Always run `tsc -b` (not plain `tsc`) so both projects build. `pnpm build` and `pnpm typecheck` already do this.

### Path alias `@/`

`@/*` resolves to `src/*` and is mirrored in **both** `tsconfig.app.json` (`paths`) and `vite.config.ts` (`resolve.alias`). When adding aliases, update both — they must agree or editor tooling and the bundler will diverge.

### Vitest configuration

Vitest config lives inside `vite.config.ts` (using `defineConfig` from `vitest/config`, not `vite`). There is no separate `vitest.config.ts`. Test environment is `happy-dom` with `globals: true`; `vitest.setup.ts` wires up `@testing-library/jest-dom` matchers.

### Biome ignores generated API client

`biome.json` ignores `src/api/generated` — the OpenAPI client (per ADR 0005) will be generated from the DRF schema via `openapi-ts`. Do not hand-edit anything that lands there; regenerate instead.

### Planned stack (from ADRs)

The scaffold is deliberately minimal — feature directories (`src/api/`, `src/routes/`, `src/components/`) are created with the first real code that needs them, not pre-stubbed. When adding capabilities, match the choices in `docs/adr/`:

| Concern | Choice | ADR |
| --- | --- | --- |
| Routing | TanStack Router | 0003 |
| Server state | TanStack Query | 0005 |
| Client state | Zustand | 0003 |
| UI kit | Mantine | 0004 |
| Forms / validation | React Hook Form + Zod | 0003 |
| Charts | Recharts | 0003 |
| API client | `openapi-ts` from DRF schema | 0005 |
| Auth | Clerk | 0006 |
| E2E tests | Playwright | 0007 |
| Errors / analytics | Sentry + PostHog | — |
| Deployment | Cloudflare Pages | 0002 |

If a task pushes against an ADR, surface that explicitly rather than silently picking a different tool.

## Environment variables

The scaffold needs no env vars. Anything Vite-exposed must be prefixed `VITE_` (browser-visible — no server-only secrets exist in this app). Planned variables, introduced by their respective stories under TGF-321:

- `VITE_CLERK_PUBLISHABLE_KEY` — Clerk frontend key.
- `VITE_API_BASE_URL` — Griddy API origin.
- `VITE_SENTRY_DSN` — Sentry DSN.
- `VITE_POSTHOG_KEY` — PostHog key.

## Conventions

- **Conventional Commits** with Jira keys: `feat(TGF-321): ...`, `fix(TGF-322): ...`.
- **Branch naming**: `<type>/TGF-<num>-<description>`.
- **PR title** matches the commit message format; PR body includes a `Closes #<num>` footer when closing an issue.
- **Formatting**: Biome with **tab indentation**, double quotes, semicolons, trailing commas. Run `pnpm format` before committing.
