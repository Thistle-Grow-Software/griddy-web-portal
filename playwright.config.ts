import { defineConfig, devices } from "@playwright/test";
import { STORAGE_STATE } from "./e2e/auth-state";

// Two run modes:
//
//   - **Smoke / CI** (default): boot the production bundle via `pnpm build &&
//     pnpm preview` and hit the real artifact. Slower but exercises what
//     deploys.
//   - **Screenshot capture** (`PLAYWRIGHT_MODE=dev`): boot `pnpm dev` with
//     `VITE_E2E_MOCK_API=true` so MSW serves the API in the browser. Fast
//     boot, no backend needed.
//
// `PLAYWRIGHT_BASE_URL` overrides webServer entirely — useful when iterating
// against an already-running dev server.
const isDevMode = process.env.PLAYWRIGHT_MODE === "dev";
const devPort = 5173;
const previewPort = 4173;
const baseURL =
	process.env.PLAYWRIGHT_BASE_URL ??
	(isDevMode ? `http://localhost:${devPort}` : `http://localhost:${previewPort}`);

export default defineConfig({
	testDir: "./e2e",
	globalSetup: "./e2e/global-setup.ts",
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: process.env.CI ? 1 : undefined,
	reporter: process.env.CI ? [["html"], ["github"]] : "html",
	use: {
		baseURL,
		trace: "on-first-retry",
		screenshot: "only-on-failure",
	},
	projects: [
		// One-time auth: signs in via Clerk and writes storage state to disk.
		// Skipped automatically when a recent state file already exists.
		{
			name: "setup",
			testMatch: /auth\.setup\.ts/,
		},
		{
			name: "chromium",
			use: {
				...devices["Desktop Chrome"],
				storageState: STORAGE_STATE,
			},
			dependencies: ["setup"],
		},
	],
	webServer: process.env.PLAYWRIGHT_BASE_URL
		? undefined
		: isDevMode
			? {
					command: `VITE_E2E_MOCK_API=true pnpm dev --strictPort --port ${devPort}`,
					url: baseURL,
					reuseExistingServer: !process.env.CI,
					timeout: 120_000,
				}
			: {
					command: `pnpm build && pnpm preview --port ${previewPort} --strictPort`,
					url: baseURL,
					reuseExistingServer: !process.env.CI,
					timeout: 120_000,
				},
});
