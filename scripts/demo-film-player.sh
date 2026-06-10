#!/usr/bin/env bash
#
# demo-film-player.sh — stand up the TGF-335 game-film player locally and print
# a URL you can open in your browser to see it in action.
#
# The feature is fully self-contained for local demoing:
#   * Vite dev server serves the React app.
#   * MSW (VITE_E2E_MOCK_API=true) answers /api/games/:id/playback/ in the
#     browser — no Django/API needed.
#   * A real ~270 KB fMP4/CMAF HLS clip in public/sample/film/ feeds hls.js, so
#     the player streams for real at zero cloud spend (no R2/Worker — ADR-0008's
#     local-first PoC).
#
# Routes are Clerk-gated, so you sign in once with the E2E test user (creds live
# in .env.local). Everything after that is mocked.
#
# Usage:
#   ./scripts/demo-film-player.sh            # start on :5173 and print the URL
#   PORT=5180 ./scripts/demo-film-player.sh  # use a different port
#
# Ctrl-C to stop the server.

set -euo pipefail

# Resolve repo dir from this script's location so it works from anywhere.
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
cd "${APP_DIR}"

PORT="${PORT:-5173}"
BASE_URL="http://localhost:${PORT}"

# A film-eligible game: status=final and season>=2024 (see fixtures.ts hasFilm()).
# This is the deterministic first NFL 2025 week-1 fixture; ?tab=film deep-links
# straight to the player.
GAME_ID="nfl-2025-w01-nfl-kc-at-nfl-sf"
FEATURE_URL="${BASE_URL}/games/${GAME_ID}?tab=film"

bold() { printf '\033[1m%s\033[0m\n' "$1"; }
info() { printf '  %s\n' "$1"; }
fail() { printf '\033[31mERROR:\033[0m %s\n' "$1" >&2; exit 1; }

# ---- Preflight ------------------------------------------------------------

command -v pnpm >/dev/null 2>&1 || fail "pnpm not found. Install pnpm 10.x (see package.json engines)."

if [[ ! -d node_modules ]]; then
	bold "Installing dependencies (pnpm install)…"
	pnpm install
fi

# Clerk publishable key is required or main.tsx throws at startup. Vite auto-loads
# .env.local, so we just need the key to be present there (or already exported).
if [[ -z "${VITE_CLERK_PUBLISHABLE_KEY:-}" ]]; then
	if [[ ! -f .env.local ]] || ! grep -q '^VITE_CLERK_PUBLISHABLE_KEY=.' .env.local; then
		fail "VITE_CLERK_PUBLISHABLE_KEY is not set. Add it to .env.local (see .env.example)."
	fi
fi

# Sanity-check the sample film actually shipped, so the player has something to play.
for f in sample.m3u8 init.mp4 seg_000.m4s poster.jpg; do
	[[ -f "public/sample/film/${f}" ]] || fail "Missing public/sample/film/${f} — the sample HLS clip is incomplete."
done

# Surface (but never print the password for) the E2E test user, since the route
# needs a sign-in.
TEST_USER="$(grep -m1 '^E2E_CLERK_USER_USERNAME=' .env.local 2>/dev/null | cut -d= -f2- || true)"

# ---- Launch the dev server ------------------------------------------------

bold "Starting Vite dev server with MSW mocks on ${BASE_URL}…"
VITE_E2E_MOCK_API=true pnpm dev --strictPort --port "${PORT}" >/tmp/griddy-film-demo.log 2>&1 &
SERVER_PID=$!

cleanup() {
	printf '\nStopping dev server…\n'
	kill "${SERVER_PID}" 2>/dev/null || true
	wait "${SERVER_PID}" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

# Wait for readiness (poll the root document).
printf 'Waiting for the server to come up'
for _ in $(seq 1 60); do
	if curl -sf -o /dev/null "${BASE_URL}/"; then
		printf ' ready.\n'
		break
	fi
	if ! kill -0 "${SERVER_PID}" 2>/dev/null; then
		printf '\n'
		cat /tmp/griddy-film-demo.log >&2 || true
		fail "Dev server exited during startup (see output above)."
	fi
	printf '.'
	sleep 1
done

if ! curl -sf -o /dev/null "${BASE_URL}/"; then
	cat /tmp/griddy-film-demo.log >&2 || true
	fail "Dev server did not become ready within 60s."
fi

# ---- Tell the user what to do --------------------------------------------

echo
bold "▶  Game film player is ready. Open this URL:"
echo
printf '   \033[1;36m%s\033[0m\n' "${FEATURE_URL}"
echo
bold "Sign in when prompted (routes are Clerk-gated):"
if [[ -n "${TEST_USER}" ]]; then
	info "User:     ${TEST_USER}"
	info "Password: in .env.local as E2E_CLERK_USER_PASSWORD"
else
	info "Use your Clerk test user (see E2E_CLERK_USER_* in .env.local)."
fi
echo
bold "What you'll see:"
info "• The Film tab streaming a real 6s HLS clip via hls.js + native <video>."
info "• Custom Mantine controls: play/pause, scrubber, speed (0.25–2×), volume, fullscreen."
info "• Keyboard shortcuts: Space/K play-pause, J/L ±10s, M mute, F fullscreen, ? help."
echo
bold "Try the other states by editing the game in the URL:"
info "• No-film (tab hidden):  ${BASE_URL}/games/nfl-2023-w01-nfl-kc-at-nfl-sf"
info "  (2023 predates the catalog → the API 404s and the Film tab disappears.)"
echo
info "Server log: /tmp/griddy-film-demo.log    •    Press Ctrl-C to stop."

# Best-effort: open the URL in a browser (WSL/Linux/macOS). Never fail on this.
if command -v wslview >/dev/null 2>&1; then
	wslview "${FEATURE_URL}" >/dev/null 2>&1 || true
elif command -v xdg-open >/dev/null 2>&1; then
	xdg-open "${FEATURE_URL}" >/dev/null 2>&1 || true
elif command -v explorer.exe >/dev/null 2>&1; then
	explorer.exe "${FEATURE_URL}" >/dev/null 2>&1 || true
fi

# Keep the server in the foreground so Ctrl-C cleans up.
wait "${SERVER_PID}"
