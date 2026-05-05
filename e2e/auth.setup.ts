import { existsSync, statSync } from "node:fs";
import { test as setup } from "@playwright/test";
import { STORAGE_STATE } from "./auth-state";
import { signInViaClerk } from "./sign-in";

// Re-sign-in if the cached state is older than this. Clerk sessions are valid
// far longer (~7 days), but refreshing weekly avoids a stale-cookie footgun
// where an apparently-good state file silently fails on the first protected
// navigation.
const STATE_TTL_MS = 6 * 24 * 60 * 60 * 1000; // 6 days

const username = process.env.E2E_CLERK_USER_USERNAME;
const password = process.env.E2E_CLERK_USER_PASSWORD;

setup.describe.configure({ mode: "serial" });

setup("authenticate", async ({ page }) => {
	setup.skip(!username || !password, "E2E Clerk credentials missing");

	if (existsSync(STORAGE_STATE)) {
		const ageMs = Date.now() - statSync(STORAGE_STATE).mtimeMs;
		if (ageMs < STATE_TTL_MS) {
			setup.skip(true, "Reusing existing storage state — delete the file to force re-auth.");
			return;
		}
	}

	await signInViaClerk(page, username as string, password as string);
	await page.context().storageState({ path: STORAGE_STATE });
});
