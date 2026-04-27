# ADR-0005: Data layer — TanStack Query + generated OpenAPI client

## Status

Accepted.

## Context

The portal communicates exclusively with the Griddy API — a
Django REST Framework service that already publishes an OpenAPI
3 schema via `drf-spectacular`. The data-fetching layer needs to:

* Provide caching, revalidation, deduplication, and background
  refresh — solved problems we don't want to re-solve.
* Stay type-safe across the network boundary. Server-side schema
  changes that break clients should be caught at compile time,
  not at runtime.
* Be reasonable to author — we don't want every viewset to
  require its own hand-written hook.

The API is REST, not GraphQL, which rules out some otherwise-
attractive candidates (Apollo Client, urql) on shape grounds.

## Decision

Use **TanStack Query** for server-state caching and revalidation,
and generate the typed HTTP client from the API's OpenAPI schema
using **`openapi-ts`** (formerly `openapi-typescript-codegen`).

## Consequences

* **No type drift between server and client.** Whenever the API
  ships a schema change, regenerating the client surfaces the
  break at type-check time. Consumers of the generated client
  see compile errors, not 4xx responses.
* **TanStack Query handles the hard parts.** Loading states,
  retries, stale-while-revalidate, optimistic updates, mutation
  invalidation — all built in. The team writes a thin `useXxx`
  hook per resource; everything else comes from the library.
* **Generated client is checked into the repo.** Regenerating
  is a single `pnpm` script tied to a fresh fetch of the
  OpenAPI document. CI verifies the checked-in client matches
  what would be generated, so drift gets caught at PR time.
* **Schema changes are visible.** When a generated-client
  regeneration produces a non-trivial diff, the PR makes the
  change visible — useful for downstream impact review.
* **Mutations require a second look.** `openapi-ts` generates
  bare RPC-style functions; wrapping them in TanStack Query
  mutations is on us. We'll likely converge on a small set of
  helper hooks for common patterns (single-resource mutate +
  invalidate).

## Alternatives considered

**Apollo Client.** Excellent but GraphQL-specific. Our API is
REST and there's no GraphQL gateway to put in front of it.
Adopting Apollo would mean either hand-writing a GraphQL layer
or using a REST-bridging adapter — both are net-negative
complexity.

**SWR.** Vercel's data-fetching library. Functionally similar
to TanStack Query for read paths; weaker on mutation handling
and developer ergonomics. TanStack Query has won mindshare in
the React community over the last two years and the ecosystem
(devtools, recipes, plugin packages) reflects that.

**Hand-written `fetch` wrappers.** Rejected. The boilerplate
cost is real — every endpoint becomes its own hook with its own
loading/error/cache logic. The bug surface (cache invalidation
mistakes, stale data) is exactly what TanStack Query was built
to solve.

**Hand-written types from the API.** Rejected. Every server-side
schema change becomes a manual type-update task that someone
will forget; type drift at the network boundary is the bug
class we most want to eliminate.

**Other OpenAPI generators (`openapi-generator-cli`,
`orval`, etc.).** `openapi-ts` is the simplest, has the
cleanest TypeScript output, and is actively maintained by a
single team rather than the OpenAPI Tools community grab-bag.
`orval` is worth keeping an eye on if we later want
TanStack-Query-aware code generation; for now, the slimmer
`openapi-ts` output suffices.

## Reference

* TGF-321 stack table.
* `griddy-archive-manager` ships an OpenAPI schema via
  `drf-spectacular`.
