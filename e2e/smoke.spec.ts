import { setupClerkTestingToken } from "@clerk/testing/playwright";
import { expect, test } from "@playwright/test";

const username = process.env.E2E_CLERK_USER_USERNAME;
const password = process.env.E2E_CLERK_USER_PASSWORD;

test.describe("smoke", () => {
	test.skip(
		!process.env.CLERK_PUBLISHABLE_KEY || !username || !password,
		"E2E Clerk credentials not configured; skipping authenticated smoke test.",
	);

	test("signs in, lands on home, navigates to /teams", async ({ page }) => {
		await setupClerkTestingToken({ page });

		await page.goto("/sign-in");

		// Clerk's hosted sign-in renders progressively; wait for the username
		// field to be ready, fill in, then proceed to password.
		await page.getByLabel(/email address|username/i).fill(username as string);
		await page.getByRole("button", { name: /^continue$/i }).click();

		await page.getByLabel(/password/i).fill(password as string);
		await page.getByRole("button", { name: /^continue$/i }).click();

		// Authenticated landing — the home title comes from the AppShell header.
		await expect(page.getByRole("heading", { name: /griddy web portal/i })).toBeVisible();

		await page.goto("/teams");
		await expect(page).toHaveURL(/\/teams$/);
	});
});
