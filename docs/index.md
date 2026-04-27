# Griddy Web Portal

The first consumer-facing client for the Griddy platform — a web portal
for authenticated coaches, scouts, and media to browse stats and watch
game film.

This documentation tracks the architectural decisions for the v1 build.
The application code lands in subsequent stories under the **TGF-321**
epic; this site will grow as those land.

## What v1 does

1. Authenticated sign-in via Clerk.
2. Browse teams, players, and games across NFL, NCAA FBS, UFL, and CFL
   for available seasons.
3. Build flexible filter queries against stats data and export results
   as CSV/Excel.
4. Play available game film on a game detail page (basic playback — no
   annotation-driven filtering yet).

For the full v1 scope and explicit non-goals, see the **TGF-321** epic.

## Architecture Decision Records

See the [ADR index](adr/README.md) for the seven architecturally-
significant decisions captured for v1, including the framework choice,
deployment target, UI kit, data layer, authentication provider, and
tooling baseline.

## Stack at a glance

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
