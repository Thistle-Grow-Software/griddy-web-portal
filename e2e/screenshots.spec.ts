import { expect, test } from "@playwright/test";
import { signInViaClerk } from "./sign-in";

const username = process.env.E2E_CLERK_USER_USERNAME;
const password = process.env.E2E_CLERK_USER_PASSWORD;

test.describe.configure({ mode: "serial" });

test.describe("screenshots", () => {
	test.skip(!username || !password, "E2E Clerk credentials missing");

	test("captures /teams, /players, and their detail tabs", async ({ page }) => {
		// Single sign-in, two captures — running signInViaClerk twice in quick
		// succession trips Clerk's per-device verification rate limit.
		await signInViaClerk(page, username as string, password as string);

		await page.goto("/teams");
		await expect(page.getByText("Buffalo Bills").first()).toBeVisible({ timeout: 15_000 });
		await page.screenshot({ path: "docs/screenshots/teams/teams-browse.png", fullPage: true });

		await page.locator("label").filter({ hasText: /^NFL$/ }).first().click();
		await expect(page.getByText("Kansas City Chiefs")).toBeVisible({ timeout: 10_000 });
		await page.screenshot({
			path: "docs/screenshots/teams/teams-browse-nfl.png",
			fullPage: true,
		});

		await page.goto("/teams/nfl-kc");
		await expect(page.getByRole("heading", { name: /Kansas City Chiefs/i })).toBeVisible({
			timeout: 15_000,
		});
		await expect(page.getByRole("table")).toBeVisible();
		await page.screenshot({
			path: "docs/screenshots/teams/team-detail-roster.png",
			fullPage: true,
		});

		await page.getByRole("tab", { name: "Schedule" }).click();
		await expect(page.getByText(/Week 1/).first()).toBeVisible({ timeout: 5_000 });
		await page.screenshot({
			path: "docs/screenshots/teams/team-detail-schedule.png",
			fullPage: true,
		});

		await page.getByRole("tab", { name: "Season Stats" }).click();
		await expect(page.getByText("Points For")).toBeVisible({ timeout: 5_000 });
		await page.screenshot({
			path: "docs/screenshots/teams/team-detail-stats.png",
			fullPage: true,
		});

		await page.goto("/teams/does-not-exist");
		await expect(page.getByText(/Team not found/i)).toBeVisible({ timeout: 15_000 });
		await page.screenshot({
			path: "docs/screenshots/teams/team-detail-404.png",
			fullPage: true,
		});

		// ─── Players ────────────────────────────────────────────────────────

		await page.goto("/players");
		await expect(page.getByTestId("player-table")).toBeVisible({ timeout: 15_000 });
		// Wait for at least one row to render so the screenshot isn't empty.
		await expect(page.locator('[data-testid^="player-row-"]').first()).toBeVisible({
			timeout: 10_000,
		});
		await page.screenshot({
			path: "docs/screenshots/players/players-browse.png",
			fullPage: true,
		});

		// Filtered: NFL + QBs
		await page.locator("label").filter({ hasText: /^NFL$/ }).first().click();
		await expect(page.locator('[data-testid^="player-row-"]').first()).toBeVisible({
			timeout: 10_000,
		});
		// Open the position select and pick QB. The MultiSelect/Select Mantine
		// markup exposes both the input and the listbox under the same label,
		// so reach for the combobox role specifically.
		await page.getByRole("combobox", { name: "Position filter" }).click();
		await page.getByRole("option", { name: "QB", exact: true }).click();
		await expect(page.locator('[data-testid^="player-row-"]').first()).toBeVisible({
			timeout: 10_000,
		});
		await page.screenshot({
			path: "docs/screenshots/players/players-browse-nfl-qb.png",
			fullPage: true,
		});

		// Empty state: search for something that won't match.
		await page.getByLabel("Search players").fill("zzzzzzz_no_match");
		await expect(page.getByText(/no players match/i)).toBeVisible({ timeout: 5_000 });
		await page.screenshot({
			path: "docs/screenshots/players/players-browse-empty.png",
			fullPage: true,
		});

		// Detail page — pick the first roster player from KC (id `nfl-kc-p1`).
		await page.goto("/players/nfl-kc-p1");
		await expect(page.getByRole("heading").first()).toBeVisible({ timeout: 15_000 });
		// Career Stats is the default tab — wait for the chart container.
		await expect(page.getByText(/by season/i)).toBeVisible({ timeout: 10_000 });
		await page.screenshot({
			path: "docs/screenshots/players/player-detail-career.png",
			fullPage: true,
		});

		// Game Log tab
		await page.getByRole("tab", { name: "Game Log" }).click();
		await expect(page.getByLabel("Season")).toBeVisible({ timeout: 5_000 });
		await page.screenshot({
			path: "docs/screenshots/players/player-detail-gamelog.png",
			fullPage: true,
		});

		// Bio tab
		await page.getByRole("tab", { name: "Bio" }).click();
		await expect(page.getByText(/college|date of birth/i).first()).toBeVisible({
			timeout: 5_000,
		});
		await page.screenshot({
			path: "docs/screenshots/players/player-detail-bio.png",
			fullPage: true,
		});

		// 404
		await page.goto("/players/does-not-exist");
		await expect(page.getByRole("heading", { name: /Player not found/i })).toBeVisible({
			timeout: 15_000,
		});
		await page.screenshot({
			path: "docs/screenshots/players/player-detail-404.png",
			fullPage: true,
		});
	});
});
