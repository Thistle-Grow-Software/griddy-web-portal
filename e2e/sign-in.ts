import { setupClerkTestingToken } from "@clerk/testing/playwright";
import type { Page } from "@playwright/test";

/**
 * Drives the Clerk-hosted sign-in flow end-to-end:
 *   email → password → "new device" email OTP (magic 424242 for `+clerk_test`
 *   users) → wait for the session to be fully established before returning.
 *
 * Note: Clerk programmatic sign-in (`clerk.signIn`) returns "Identifier is
 * invalid" against this test instance regardless of identifier shape, so we
 * drive the UI. Clerk per-user OTP rate-limits mean back-to-back sign-ins
 * may fail with "You need to send a verification code before attempting to
 * verify"; sign in *once per test run* and capture all screenshots within
 * the same browser session.
 */
export async function signInViaClerk(
	page: Page,
	username: string,
	password: string,
): Promise<void> {
	await setupClerkTestingToken({ page });

	await page.goto("/sign-in");

	await page.getByLabel(/email address|username/i).fill(username);
	await page.getByRole("button", { name: /^continue$/i }).click();

	const passwordInput = page.locator('input[type="password"]').first();
	await passwordInput.waitFor({ state: "visible", timeout: 20_000 });
	await passwordInput.fill(password);
	await page.getByRole("button", { name: /^continue$/i }).click();

	const onFactorTwo = await page
		.waitForURL(/\/sign-in\/factor-two/, { timeout: 10_000 })
		.then(() => true)
		.catch(() => false);
	if (onFactorTwo) {
		const firstCell = page
			.locator('input[inputmode="numeric"], input[autocomplete="one-time-code"]')
			.first();
		await firstCell.waitFor({ state: "visible", timeout: 10_000 });
		await firstCell.click();
		await page.keyboard.type("424242");
	}

	await page.waitForURL((url) => !url.pathname.startsWith("/sign-in"), {
		timeout: 30_000,
	});
	await page.waitForFunction(() => window.Clerk?.user != null, undefined, {
		timeout: 15_000,
	});
}
