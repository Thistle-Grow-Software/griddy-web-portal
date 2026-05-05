import { clerkSetup } from "@clerk/testing/playwright";
import type { FullConfig } from "@playwright/test";

/**
 * Pre-flight for E2E: exchanges the Clerk testing keys for short-lived
 * testing tokens so `setupClerkTestingToken({ page })` inside specs can sign
 * in without going through the interactive OAuth flow.
 *
 * Required env vars (set as repo secrets in CI, in `.env.local` for local
 * runs — never the production Clerk keys):
 *   CLERK_PUBLISHABLE_KEY  — Clerk publishable key for the test instance.
 *                            Falls back to VITE_CLERK_PUBLISHABLE_KEY so a
 *                            single `.env.local` entry covers both Vite and
 *                            Clerk-testing.
 *   CLERK_SECRET_KEY       — Clerk secret key for the test instance.
 *
 * Optional, used by the smoke spec / auth setup:
 *   E2E_CLERK_USER_USERNAME, E2E_CLERK_USER_PASSWORD — pre-provisioned
 *   test user in the same Clerk test instance.
 */
export default async function globalSetup(_config: FullConfig) {
	// Mirror the Vite-prefixed key into the unprefixed slot Clerk-testing
	// expects, so .env.local doesn't need to duplicate the same value.
	if (!process.env.CLERK_PUBLISHABLE_KEY && process.env.VITE_CLERK_PUBLISHABLE_KEY) {
		process.env.CLERK_PUBLISHABLE_KEY = process.env.VITE_CLERK_PUBLISHABLE_KEY;
	}

	if (!process.env.CLERK_PUBLISHABLE_KEY || !process.env.CLERK_SECRET_KEY) {
		console.warn(
			"[playwright/global-setup] CLERK_PUBLISHABLE_KEY / CLERK_SECRET_KEY not set; " +
				"specs that call setupClerkTestingToken will skip themselves.",
		);
		return;
	}
	await clerkSetup();
}
