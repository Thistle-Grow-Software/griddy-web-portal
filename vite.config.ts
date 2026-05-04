import path from "node:path";
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
	],
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
