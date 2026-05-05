import path from "node:path";
import { sentryVitePlugin } from "@sentry/vite-plugin";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

// Vite + Vitest configuration in one file. ``defineConfig`` is imported
// from ``vitest/config`` rather than ``vite`` so the ``test`` block is
// typed correctly without a separate vitest.config.ts.
// Path alias ``@/`` resolves to ``src/`` and is mirrored in
// tsconfig.app.json so editor tooling and the bundler agree.
// https://vite.dev/config/
export default defineConfig({
	plugins: [
		tanstackRouter({
			target: "react",
			autoCodeSplitting: true,
			quoteStyle: "double",
		}),
		react(),
		// Source-map upload to Sentry. No-ops without SENTRY_AUTH_TOKEN, so the
		// plugin stays inert in local dev and on CI runs where the secret is
		// absent (e.g. forked-PR runs that can't read repo secrets).
		sentryVitePlugin({
			org: process.env.SENTRY_ORG,
			project: process.env.SENTRY_PROJECT,
			authToken: process.env.SENTRY_AUTH_TOKEN,
			disable: !process.env.SENTRY_AUTH_TOKEN,
			telemetry: false,
		}),
	],
	build: {
		// Required so the Sentry plugin has source maps to upload. The plugin
		// deletes them from `dist/` after upload by default in production.
		sourcemap: true,
	},
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "src"),
		},
	},
	test: {
		globals: true,
		environment: "happy-dom",
		setupFiles: ["./vitest.setup.ts"],
		css: true,
	},
});
