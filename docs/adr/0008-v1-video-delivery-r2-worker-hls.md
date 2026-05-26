# ADR-0008: v1 game-film delivery — R2 + Worker-gated HLS

## Status

Proposed.

The substantive investigation is the TGF-337 spike and its Confluence
page (*TGF-337: Video Delivery MVP*). This ADR records the decision that
spike points to; it moves to `Accepted` once the proof-of-concept plays a
game end-to-end with auth gating in place.

## Context

TGF-335 needs to play existing game film in the browser, and the user
wants video from v1 even on basic infrastructure. The TGF-337 spike
characterized the catalog and weighed delivery options. Three findings
constrain the decision:

* **The catalog is HLS-friendly already.** 1,203 files, 2.95 TiB; 99.3%
  H.264 video, 99.8% AAC audio, and every sampled file has a regular
  keyframe interval ≤10s (98.7% ≤6s). That is exactly the shape that
  segments into HLS with a lossless `ffmpeg -c copy` remux — no
  re-encode — except for ~10 outlier files (VP9/AV1/HEVC video, Opus/AC-3
  audio) that need a one-off transcode.
* **Storage is decided: Cloudflare R2.** No egress fees and S3
  compatibility, consistent with deploying the portal on Cloudflare Pages
  (ADR-0002). Roughly $150/mo per 10 TB versus ~$215/mo plus ~$75/TB
  egress on S3.
* **HLS fans out into many requests.** A stream is a manifest plus
  hundreds of segment objects, each a separate HTTP request. R2 presigned
  URLs authorize a single object, work only on the S3 endpoint (not a
  custom domain), and cap at a 7-day expiry — so they cannot gate a
  stream. Access control has to sit in front of every request.

Auth already exists end-to-end: the portal authenticates with Clerk
(ADR-0006) and the Griddy API validates Clerk JWTs (TGF-312).

## Decision

Serve v1 game film as **HLS from Cloudflare R2, gated by a Cloudflare
Worker on a dedicated video origin**, with manifests/segments produced by
a **one-time batch remux**. Concretely:

* **Packaging.** A one-time batch job runs `ffmpeg -c copy` (or Shaka
  Packager / Bento4 `mp4hls`) per game → CMAF/fMP4 segments + `.m3u8` at a
  ~6s target, uploaded to R2. The ~10 non-conforming files get a transcode
  pass first. Not on-demand packaging — the catalog is static history.
* **Access control.** The portal calls `GET /api/games/{id}/playback`
  with its Clerk JWT. Django checks entitlement and returns the manifest
  URL plus a short-lived, game-scoped token. A Worker bound to the R2
  bucket (e.g. `video.griddy.football`) validates that token — exchanging
  it once for a Worker-set **signed cookie** so it rides every subsequent
  segment request — and streams objects from its bucket binding.
  Unauthorized requests to the manifest or any segment get a 403.
* **CORS.** The Worker emits explicit allowed origins (the portal dev and
  prod origins, never `*`, because requests are credentialed) with
  `Access-Control-Allow-Credentials: true`, `GET, HEAD`, `Range` allowed,
  and `Content-Range`/`Accept-Ranges`/`Content-Length`/`ETag` exposed for
  scrubbing.
* **Player.** The portal uses **`@vidstack/react`**, which wraps `hls.js`
  for cross-browser HLS and falls back to native HLS on Safari, with
  `crossorigin="use-credentials"` so segment fetches carry the cookie.

## Consequences

* **A new deployable enters the picture.** The portal itself stays
  browser-only (no server component), but v1 video introduces a Cloudflare
  Worker and an R2 bucket as infrastructure. Same vendor as Pages
  (ADR-0002), so no new account or operational surface — but it is the
  first server-side code the project owns, and needs its own deploy and
  logging story.
* **Auth stays single-sourced.** Entitlement decisions live in Django
  against the existing Clerk JWTs; the Worker only verifies a token Django
  minted. No second identity surface.
* **Credential lifetime must outlive a segment fetch.** A game runs hours,
  so the signed cookie carries a few-hours TTL (or the portal silently
  re-mints the token). Baking one short expiry into per-segment URLs would
  make late segments 403 mid-game — explicitly avoided.
* **Packaged storage roughly doubles catalog footprint.** Remux is ~1× the
  source, so budget ~3 TiB of segments alongside the originals (well under
  ~$50/mo on R2, zero egress).
* **Cheap path to v1.5 ABR.** Vidstack + hls.js consume multi-rendition
  manifests with no client change, so adding a bitrate ladder later
  (TGF-338) is a packaging concern, not a player rewrite.
* **`@vidstack/react` is a single-PR-reversible choice.** Per the ADR bar
  it would normally live in the README stack table; it is recorded here
  only because it is inseparable from the delivery approach. Swapping it
  for bare `hls.js` + `<video>` later does not require a new ADR.

## Alternatives considered

**Serve raw progressive MP4 from R2, no packaging (ticket Option C-ish).**
Genuinely viable: 99.8% of files are progressive MP4/H.264/AAC and play
natively via HTTP range requests with zero pipeline. Rejected as the
*headline* approach because player assumption #8 commits to HLS and HLS
buys adaptive bitrate for v1.5 — but it remains the fallback if the
packaging job slips, since it ships nothing new.

**S3 + CloudFront with signed URLs / signed cookies (ticket Option A).**
The most familiar pattern and CloudFront signed cookies solve the
fan-out cleanly. Rejected on cost (egress) and vendor consistency — we are
already all-in on Cloudflare for Pages and storage.

**R2 presigned URLs as the access mechanism (ticket Option B, naive
form).** Rejected on hard constraints: one object per URL, S3 endpoint
only (no custom domain), 7-day max expiry. Workable for a single-file
download, unworkable for a multi-segment stream.

**On-demand / just-in-time packaging in the Worker.** More flexible, no
pre-baked storage cost. Rejected for v1 — the catalog is static, so JIT
adds latency and complexity for no benefit. Revisit under TGF-338 if the
library grows or becomes dynamic.

## Reference

* TGF-337 — *Spike: Minimum viable video delivery for v1*, and its
  Confluence page *TGF-337: Video Delivery MVP* (catalog report +
  question-by-question determinations).
* TGF-335 — the player-component story this unblocks.
* TGF-338 — video delivery at scale (ABR ladders, JIT packaging) for v1.5+.
* ADR-0002 (Cloudflare Pages) — the platform-consistency principle.
* ADR-0006 (Clerk) / TGF-312 — the auth surface the playback endpoint
  builds on.
