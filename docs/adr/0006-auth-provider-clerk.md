# ADR-0006: Authentication provider — Clerk

## Status

Accepted.

## Context

The portal needs an authentication provider for sign-up,
sign-in, session management, and a path to organizations / RBAC
later. The decision was already made on the API side — the
Griddy backend chose Clerk in **TGF-312** and shipped JWT
verification, permission catalogs, and lazy user sync built on
that choice. The portal is the first real client of that auth
surface.

## Decision

Use **Clerk** as the authentication provider for the portal.
This ADR exists to make the inheritance explicit; the
substantive evaluation is in TGF-312.

## Consequences

* **Tokens validate end-to-end on the first try.** The API is
  already configured to validate Clerk-issued JWTs; the portal
  passes tokens through and the API recognizes them. No
  glue-layer auth code in the middle.
* **Pre-built UI for sign-up / sign-in.** Clerk's `<SignIn />`
  and `<SignUp />` React components handle the flows we'd
  otherwise build by hand. We retain control over routing
  (post-sign-in destinations, redirect-back behavior) but skip
  the form work.
* **Session refresh is automatic.** Clerk session tokens have
  a short TTL (~60s) and the SDK handles refresh transparently.
  The portal calls `getToken()` per request and gets a current
  one; we don't manage refresh tokens or rotation ourselves.
* **Inherited downsides.** Whatever trade-offs TGF-312 weighed
  (vendor lock-in, pricing curve at scale, the choice of
  user-metadata vs. organization roles for permissions) apply
  here too. The portal does not get a second say.
* **Operational consistency.** One Clerk instance covers both
  the API and the portal. Adding mobile/Roku clients later
  joins the same instance.

## Alternatives considered

**A different provider for the portal than the API.** Rejected
out of hand. Token issuance and validation must agree;
splitting providers would mean writing translation glue and
maintaining two identity surfaces. No upside.

**Self-rolled auth on the portal side.** Rejected. The API
expects JWTs from a published JWKS; the portal would need to
either implement that itself or run a parallel identity
service. Both are large investments for v1.

**Re-evaluate Clerk vs. Auth0 / Cognito for the portal
specifically.** Considered and rejected. The portal's auth
needs are a strict subset of the API's; re-running the
evaluation in a portal-only context cannot produce a different
correct answer without also unwinding TGF-312.

## Reference

* TGF-312 (Implement Clerk-backed authentication for Griddy
  API) is the substantive ADR-equivalent for this decision.
* TGF-313, TGF-315, TGF-316, TGF-317, TGF-318, TGF-319 — the
  implementation stories that built the API-side auth on
  Clerk.
