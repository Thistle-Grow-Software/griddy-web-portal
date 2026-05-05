import { setupClerkTestingToken } from "@clerk/testing/playwright";
import { expect, test } from "@playwright/test";

const username = process.env.E2E_CLERK_USER_USERNAME;
const password = process.env.E2E_CLERK_USER_PASSWORD;

test.describe.configure({ mode: "serial" });

test.describe("screenshots", () => {
	test.skip(!username || !password, "E2E Clerk credentials missing");

	test("captures /teams and /teams/$teamId tabs", async ({ page }) => {
		await setupClerkTestingToken({ page });

		await page.goto("/sign-in");

		// Email step
		await page.getByLabel(/email address|username/i).fill(username as string);
		await page.getByRole("button", { name: /^continue$/i }).click();

		// Password step (Clerk swaps DOM during transition — wait on the input).
		const passwordInput = page.locator('input[type="password"]').first();
		await passwordInput.waitFor({ state: "visible", timeout: 20_000 });
		await passwordInput.fill(password as string);
		await page.getByRole("button", { name: /^continue$/i }).click();

		// "New device" email verification: Clerk test users with `+clerk_test`
		// accept the magic OTP code 424242. The OTP cells are keyboard-driven,
		// so type rather than .fill().
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
			// Clerk's OTP widget auto-submits when the last digit lands, so we
			// don't need a separate Continue click. Just type the code.
			await page.keyboard.type("424242");
		}

		// Wait for Clerk to fully establish the session before any protected
		// navigation — otherwise requireAuth bounces us right back to /sign-in.
		await page.waitForURL((url) => !url.pathname.startsWith("/sign-in"), {
			timeout: 30_000,
		});
		await page.waitForFunction(() => window.Clerk?.user != null, undefined, {
			timeout: 15_000,
		});

		// Browse page
		await page.goto("/teams");
		await expect(page.getByText("Buffalo Bills").first()).toBeVisible({ timeout: 15_000 });
		await page.screenshot({ path: "docs/screenshots/teams/teams-browse.png", fullPage: true });

		// Browse with NFL filter — Mantine SegmentedControl exposes labels as
		// either radio or button elements depending on version; click the label.
		await page.locator("label").filter({ hasText: /^NFL$/ }).first().click();
		await expect(page.getByText("Kansas City Chiefs")).toBeVisible({ timeout: 10_000 });
		await page.screenshot({ path: "docs/screenshots/teams/teams-browse-nfl.png", fullPage: true });

		// Detail page — Roster tab (default)
		await page.goto("/teams/nfl-kc");
		await expect(page.getByRole("heading", { name: /Kansas City Chiefs/i })).toBeVisible({
			timeout: 15_000,
		});
		await expect(page.getByRole("table")).toBeVisible();
		await page.screenshot({
			path: "docs/screenshots/teams/team-detail-roster.png",
			fullPage: true,
		});

		// Detail — Schedule tab
		await page.getByRole("tab", { name: "Schedule" }).click();
		await expect(page.getByText(/Week 1/).first()).toBeVisible({ timeout: 5_000 });
		await page.screenshot({
			path: "docs/screenshots/teams/team-detail-schedule.png",
			fullPage: true,
		});

		// Detail — Season Stats tab
		await page.getByRole("tab", { name: "Season Stats" }).click();
		await expect(page.getByText("Points For")).toBeVisible({ timeout: 5_000 });
		await page.screenshot({ path: "docs/screenshots/teams/team-detail-stats.png", fullPage: true });

		// 404
		await page.goto("/teams/does-not-exist");
		await expect(page.getByText(/Team not found/i)).toBeVisible({ timeout: 15_000 });
		await page.screenshot({ path: "docs/screenshots/teams/team-detail-404.png", fullPage: true });
	});
});
