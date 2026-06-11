# ADR-0009: v1.5 video delivery at scale — extend self-hosted R2 + Worker

## Status

Proposed.

The substantive investigation is the TGF-338 spike. Its deliverables — a
build-vs-buy comparison, a migration plan, and a backend design sketch — live in
the `griddy-archive-manager` repo under
[`docs/video-scale/`](https://github.com/Thistle-Grow-Software/griddy-archive-manager/blob/main/docs/video-scale/index.md)
(the backend's home, alongside the v1 `docs/video-poc/`). This ADR records the
decision they point to. It moves to `Accepted` once the v1.5 implementation epic
begins.

Supersedes nothing; **extends ADR-0008** (v1 game-film delivery).

## Context

Before v1.5 work on NFL-Pro-style filtered clip playback and PBP sync (TGF-339)
begins, TGF-338 asked whether the v1 delivery stack should scale up or be
replaced by a managed product (Mux, Cloudflare Stream) or a heavier AWS pipeline.
Three findings from the spike constrain the decision:

* **The catalog's shape favors self-hosting.** It is large (~2.95 TiB), static
  history, and already 99% H.264/AAC. That means storage-dominated cost and a
  **one-time** transcode — the exact regime where managed per-minute pricing
  loses. Modeled to ~1.5× accuracy, self-hosted R2 stays flat at ~$120/mo at
  every viewing volume from pilot to 100k streams/mo, while CF Stream (~$600–3,600),
  Mux (~$360–3,360), and AWS CloudFront (~$146–5,878) all start higher and grow
  with delivered minutes. **No viewing volume makes an alternative cheaper.**
* **v1 already built the hard parts.** The Worker auth gate, signed cookie, CORS,
  Range/scrubbing, and CMAF/HLS packaging shipped in TGF-360/361/362/363. ABR is
  "a packaging concern, not a player rewrite" (ADR-0008) because vidstack/hls.js
  already consume multivariant manifests. The marginal cost of v1.5 is additive.
* **Clip playback is *better* self-hosted, not just cheaper.** Owning the segment
  store lets a clip be a generated HLS manifest over already-stored segments — no
  re-encode, no new storage — which the managed clipping APIs cannot match
  without re-rendering or storing derived clips.

## Decision

**Extend the v1 self-hosted Cloudflare R2 + Worker stack for v1.5 rather than
re-platform onto a managed service.** Concretely:

* **ABR ladder.** A one-time batch transcode produces a 240/480/720/1080 CMAF/HLS
  ladder (each rung capped at source resolution) at the existing ~6 s segment
  target, written additively alongside the v1 single-rendition objects. Generalizes
  the TGF-362 packager.
* **Access control at scale.** Keep the v1 per-game token for single-game
  playback; **add** a short-lived session-scoped token carrying an entitlement
  claim for cross-catalog browsing. Entitlement stays single-sourced in Django
  (against Clerk, ADR-0006); the Worker gains an entitlement check, not a second
  identity surface.
* **Clip service (unblocks TGF-339).** A **synthesized clip manifest** — Django
  generates an HLS media playlist referencing the stored ABR segments overlapping
  a requested time range; the Worker gates it. Segment (~6 s) granularity for
  v1.5, frame-accurate boundary trimming deferred.
* **Analytics / QoS.** Adopt **Mux Data** (player analytics, sold decoupled from
  delivery, free under ~100k views/mo) on the existing player for startup time,
  rebuffer ratio, completion, and error rate.
* **DRM.** Deferred — the catalog is owned/archival football film. Revisit only
  if licensed broadcast footage with a DRM-mandating contract enters.

## Consequences

* **No re-platforming, no vendor migration, no broken URLs.** The move is additive
  and zero-downtime: migrated games serve ABR, not-yet-migrated games serve the
  retained v1 single rendition, and the player handles both unchanged. Every phase
  is independently reversible (see the migration plan).
* **Storage roughly doubles, cost stays in the ~$100s/mo class.** The ABR ladder
  plus retained originals is ~6–7.5 TB → ~$115/mo on R2 with free egress — the
  same order of magnitude as v1, not the ~$1,000s/mo of the managed options.
* **We own the transcode pipeline and the clip logic.** Justified while the
  catalog is static (transcode runs once). The explicit trigger to revisit "buy"
  is **user-generated uploads**, which create a *continuous* transcode pipeline
  where Mux's managed encoding would earn its premium. Mux Video is kept as the
  documented escape hatch for that day; this ADR is for the static catalog.
* **We buy exactly one thing: analytics.** Mux Data gives the QoS bar without the
  delivery premium and is removable in a single PR.
* **Auth stays single-sourced.** Same Django-mints / Worker-verifies model as v1,
  extended to entitlement-scoped sessions.

## Alternatives considered

**Re-platform onto Mux Video.** Best DX and turnkey ABR/analytics/clipping.
Rejected for the static catalog on cost (a $360/mo storage floor before any
viewing, 3–10× the whole R2 bill) and because v1 already owns the equivalent
gate and packaging. Retained as the escape hatch for user uploads.

**Cloudflare Stream.** Native to our account, near-zero ops. Rejected on the same
cost basis (a ~$600/mo stored-minute floor) — being on Cloudflare already, we get
the vendor-consistency benefit from R2 without the managed-delivery premium.

**Self-hosted AWS (S3 + CloudFront + MediaConvert).** Familiar, but CloudFront
egress grows linearly with viewing and crosses above R2 by ~Small volume,
reaching ~40× R2 at Heavy. Rejected on cost and ops; only justified if live
streaming (MediaLive) were planned, which it is not.

**Persistent JIT transcoding/packaging service.** More flexible for dynamic
libraries. Rejected for v1.5 — the catalog is static, so one-time batch is
strictly cheaper and simpler. Revisit with user uploads.

## Reference

* TGF-338 — *Spike: Video delivery infrastructure at scale*, and its
  `docs/video-scale/` deliverables (comparison, migration plan, backend design).
* TGF-339 — the filtered-clip / PBP-sync feature this unblocks.
* ADR-0008 — v1 game-film delivery (R2 + Worker-gated HLS); this ADR extends it.
* ADR-0002 (Cloudflare Pages) — the platform-consistency principle.
* ADR-0006 (Clerk) — the auth surface the entitlement check builds on.
