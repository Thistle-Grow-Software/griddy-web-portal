# ADR-0003: Use React + Vite, no meta-framework

## Status

Accepted.

## Context

The portal is a SPA-shaped product: every meaningful page sits
behind a Clerk sign-in. There is no public catalog requiring SEO,
no anonymous content surface, and no multi-tenant marketing
funnel. The product is a tool, not a website.

Choosing a React framework is mostly a question of how much
opinionation we want — Next.js, Remix, and TanStack Start all add
opinionated routing, server-side rendering, and (in the case of
Next) a particular React paradigm (Server Components / app router).
Vite is the no-opinionation alternative: a fast bundler, a dev
server with HMR, and that's it.

## Decision

Use **React + Vite** with no meta-framework. Routing is handled by
TanStack Router (a separate, smaller decision); SSR is not part of
the v1 architecture.

## Consequences

* **Smaller cognitive surface for contributors.** React + Vite is
  the thing every front-end developer has touched at least once;
  there's no framework-specific paradigm to learn (file-system
  routing conventions, server component boundaries, loader
  semantics, etc.).
* **Authentication is straightforward.** The whole app sits behind
  a single Clerk gate; no need to navigate around server-rendered
  paths that need to handle anonymous traffic.
* **No server runtime to operate.** Cloudflare Pages serves the
  static bundle. If we later need server-side endpoints (for OG
  images, webhook handling, etc.) we'll add them as Pages
  Functions.
* **No SEO benefit by default.** Acceptable — the entire product
  is behind auth, so SEO isn't a goal.
* **Initial-load size is on us.** Without SSR there's no rendering
  optimization handed to us by a framework; we're responsible for
  code-splitting and lazy-loading where it matters.

## Alternatives considered

**Next.js (app router).** Rejected. Server components and the app
router add a paradigm to learn for negligible benefit when the
entire product is behind auth. The tooling complexity (RSC payload,
streaming, the rendering split between server and client) is real
overhead with no upside for our use case.

**Remix.** Rejected. Strong loader/action model is genuinely
appealing, but it's optimized for the case where pages benefit
from SSR and progressive enhancement. Behind auth, neither
matters; we'd be paying complexity tax for unused features.

**TanStack Start.** Rejected mostly on maturity. Promising
project but less proven in production deployments than React +
Vite. We're already adopting other TanStack libraries (Router,
Query) — adopting Start as well would concentrate too much of our
stack on one ecosystem at one point in time.

**Create React App / Webpack.** Not seriously considered.
Effectively deprecated and slower than Vite for both dev and
build.

## Reference

* TGF-321 stack table.
