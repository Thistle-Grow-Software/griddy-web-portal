# ADR-0001: Sequence frontend platforms web → mobile → Roku

## Status

Accepted. Captures the outcome of the **TGF-275** scoping spike.

## Context

The Griddy platform's v1 catalog covers four leagues (NFL back to 2016,
a patchwork of NCAA games from the last ~5 years, UFL 2025 plus the
played portion of 2026, CFL 2025) and is targeted at authenticated
coaches, scouts, and some media. The eventual product surface includes
mobile and TV apps, but only one of those needs to ship first.

Three reasonable choices for the first client surface:

* **Web** — runs anywhere with a browser, no app store gatekeeping.
* **Mobile** — best for "on the move" consumption.
* **Roku / TV** — best for "couch" consumption of long-form film.

The audience for v1 (coaches, scouts) does most of its stats work at a
desk. Film review at v1 is "play this game" rather than the
NFL-Pro-style annotation-driven filtering the product aspires to ship
in v1.5. Annotation tooling is the upstream blocker for the more
interesting mobile/TV use cases.

## Decision

Sequence the platforms **web → mobile → Roku**. Build the web portal
first. Defer mobile and Roku apps to v1.5+, when the annotation data
model exists and video-centric clients have something distinctive to
deliver.

## Consequences

* The web portal is the only consumer of the API for v1, which means
  authentication, permission, and rate-limit decisions land in the
  context of a single client. Mobile/Roku clients later inherit
  whatever shape we converge on; if any of those decisions don't
  generalize, that's our problem to solve.
* Stats browsing and export — a desk-friendly task — is appropriately
  the priority feature for v1.
* Native-platform-only investments (push notifications, offline video,
  background download, TV remote UX) are deferred. Customers who want
  those will see them later in the roadmap.
* Hiring/staffing implications: we can build v1 entirely with web
  skills. Native-mobile and Roku-channel expertise are deferred
  hiring/contracting decisions.

## Alternatives considered

**Mobile first.** Rejected because the high-value mobile use case is
on-the-go film review, which depends on the annotation tooling
(deferred to v1.5). Without that, a v1 mobile app duplicates the web
experience at higher build/distribution cost.

**Roku first.** Rejected for the same reason as mobile, and more
forcefully — TV is the worst surface for stats browsing/export, which
is the v1 anchor feature.

**Multi-platform parallel.** Rejected on capacity grounds. Splitting
v1 effort across two or three platforms would slow each surface and
delay the moment any user can sign in and accomplish a real task.

## Reference

* TGF-275 (the scoping spike).
* Confluence page: "TGF-275: Defining Scope of the Viewing Portal".
* TGF-321 (v1 epic) for the full scope and explicit non-goals.
