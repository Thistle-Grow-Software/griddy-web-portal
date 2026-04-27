# Architecture Decision Records

This directory contains the architecturally-significant decisions made
during the v1 build of the Griddy Web Viewing Portal. ADRs are written
in Nygard style — Status, Context, Decision, Consequences, Alternatives —
and kept short on purpose. If a record is running over two pages, it
has become a design document and should be split.

## Conventions

* **Filenames** follow `NNNN-short-title.md` with a 4-digit zero-padded
  number; the number never changes once assigned.
* **Status** is one of `Proposed`, `Accepted`, `Deprecated`, or
  `Superseded by ADR-XXXX`. Once an ADR is published, do not edit it
  to record a later change of mind. Author a new ADR instead and mark
  the old one as `Superseded by`.
* **Decisions on smaller-scope tooling** (e.g. specific React libraries
  whose substitution would be a single-PR refactor) live in the
  README's stack table, not as ADRs. The bar for a new ADR is "would
  reversing this require coordinated work across multiple stories?"

## Index

| # | Title | Status |
| --- | --- | --- |
| 0001 | [Sequence frontend platforms web → mobile → Roku](0001-sequence-frontend-platforms.md) | Accepted |
| 0002 | [Deploy the web portal on Cloudflare Pages](0002-deploy-on-cloudflare-pages.md) | Accepted |
| 0003 | [Use React + Vite, no meta-framework](0003-react-vite-no-meta-framework.md) | Accepted |
| 0004 | [UI kit — Mantine](0004-ui-kit-mantine.md) | Accepted |
| 0005 | [Data layer — TanStack Query + generated OpenAPI client](0005-data-layer-tanstack-query-openapi.md) | Accepted |
| 0006 | [Authentication provider — Clerk](0006-auth-provider-clerk.md) | Accepted |
| 0007 | [Tooling baseline — pnpm + Biome + Vitest + Playwright](0007-tooling-baseline.md) | Accepted |

## Out of scope for the initial set

The following decisions are **made** (see the README's stack table) but
do not yet have dedicated ADRs because reversing them would be a
single-PR refactor rather than a coordinated effort across stories:

* Routing — TanStack Router
* Client state — Zustand
* Forms / validation — React Hook Form + Zod
* Charts — Recharts
* Observability — Sentry (errors) + PostHog (product analytics)

If any of these become contentious or the cost-of-change rises, promote
the relevant choice to a dedicated ADR at that point.
