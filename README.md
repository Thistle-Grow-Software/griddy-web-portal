# griddy-web-portal

The first consumer-facing client for the [Griddy](https://github.com/Thistle-Grow-Software/all-things-griddy) platform — a web portal for authenticated coaches, scouts, and media to browse stats and watch game film.

This repo currently contains only architecture decisions for the v1 build (see [`docs/adr/`](docs/adr/README.md)). The application code lands in subsequent stories.

## What v1 does

1. Authenticated sign-in via Clerk.
2. Browse teams, players, and games across NFL, NCAA FBS, UFL, and CFL for available seasons.
3. Build flexible filter queries against stats data and export results as CSV/Excel.
4. Play available game film on a game detail page (basic playback — no annotation-driven filtering yet).

For the full v1 scope and explicit non-goals, see Jira **TGF-321** ("Griddy Web Viewing Portal v1").

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

For the rationale behind each choice, see the [Architecture Decision Records](docs/adr/README.md).

## Repository status

Bootstrap-only as of this commit. Application scaffolding (Vite project init, Clerk integration, OpenAPI client generation, etc.) is tracked in follow-up Jira stories under the **TGF-321** epic.

## License

[MIT](LICENSE)
