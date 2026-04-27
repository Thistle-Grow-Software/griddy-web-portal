# ADR-0002: Deploy the web portal on Cloudflare Pages

## Status

Accepted.

## Context

The portal is a single-page React + Vite application. Its hosting
needs are unremarkable: serve static assets globally, support
preview deploys per pull request, expose a custom domain
(`portal.thistlegrow.software`), and give us a sensible logging and
metrics surface for production traffic.

Thistle Grow already runs the documentation site (managed by
**TGF-248**) on Cloudflare Pages. The team has working accounts,
established DNS records, deploy keys, and operational familiarity
with the platform.

## Decision

Deploy the web portal on **Cloudflare Pages**.

## Consequences

* **Operational consistency.** One vendor, one dashboard, one
  CLI to learn — we already pay this cost for the docs site. No new
  account/billing surface, no new on-call playbook.
* **Preview deploys per PR** are a built-in feature; no Vercel-style
  configuration overhead to enable them.
* **Edge runtime** is available if a future server-side endpoint is
  needed (auth callbacks, Open Graph image generation, etc.). We
  don't require this for v1 but it's there if we do.
* **Vendor concentration risk.** All web-hosted artifacts now sit
  with one provider. A Cloudflare-wide outage takes down both the
  marketing/docs surface and the portal simultaneously. Acceptable
  trade-off for v1; revisit if multi-region failover becomes a
  requirement.
* **Rollback story is GitOps.** Pages reverts to the previous deploy
  on demand or by re-pushing. We don't need a separate artifact
  store.

## Alternatives considered

**Vercel.** Comparable feature set and arguably the most widely
deployed React-app target. Rejected on the "we already use
Cloudflare for docs" principle — adopting Vercel would mean two
hosting vendors, two billing surfaces, and two operational learning
curves.

**Netlify.** Similar to Vercel; same reasoning rejects it.

**AWS (S3 + CloudFront).** Lower-level but more operational work
(bucket setup, CloudFront invalidations, custom CI for previews).
Cost-effective at scale, but the v1 portal is well below the scale
where S3 + CloudFront pays back its complexity vs. Pages.

## Reference

* TGF-248 (Zensical docs site infrastructure on Cloudflare Pages).
