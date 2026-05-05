import { expect, test } from "@playwright/test";

// Auth comes from the persisted storage state set up by `auth.setup.ts`
// (configured as a project dependency in playwright.config.ts) — this spec
// no longer needs to drive the Clerk sign-in flow on every run.
test.describe.configure({ mode: "serial" });

test.describe("screenshots", () => {
	test("captures /teams and /teams/$teamId tabs", async ({ page }) => {
		await page.goto("/teams");
		await expect(page.getByText("Buffalo Bills").first()).toBeVisible({ timeout: 15_000 });
		await page.screenshot({ path: "docs/screenshots/teams/teams-browse.png", fullPage: true });

		// Browse with NFL filter — Mantine SegmentedControl exposes labels as
		// either radio or button elements depending on version; click the label.
		await page.locator("label").filter({ hasText: /^NFL$/ }).first().click();
		await expect(page.getByText("Kansas City Chiefs")).toBeVisible({ timeout: 10_000 });
		await page.screenshot({
			path: "docs/screenshots/teams/teams-browse-nfl.png",
			fullPage: true,
		});

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
		await page.screenshot({
			path: "docs/screenshots/teams/team-detail-stats.png",
			fullPage: true,
		});

		// 404
		await page.goto("/teams/does-not-exist");
		await expect(page.getByText(/Team not found/i)).toBeVisible({ timeout: 15_000 });
		await page.screenshot({
			path: "docs/screenshots/teams/team-detail-404.png",
			fullPage: true,
		});
	});
});
