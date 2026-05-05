import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:4173";

// Reuse the user's existing dev/preview server when one is already up
// (faster local iteration). On CI we always boot a fresh `pnpm preview`
// against the production bundle so the smoke test exercises real artifacts.
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
		{
			name: "chromium",
			use: { ...devices["Desktop Chrome"] },
		},
	],
	webServer: process.env.PLAYWRIGHT_BASE_URL
		? undefined
		: {
				command: "pnpm build && pnpm preview --port 4173 --strictPort",
				url: baseURL,
				reuseExistingServer: !process.env.CI,
				timeout: 120_000,
			},
});
