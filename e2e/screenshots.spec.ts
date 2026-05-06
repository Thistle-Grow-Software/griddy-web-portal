import { expect, test } from "@playwright/test";

// Auth comes from the persisted storage state set up by `auth.setup.ts`
// (configured as a project dependency in playwright.config.ts) — these specs
// no longer drive the Clerk sign-in flow on every run.
//
// These are visual-capture specs, not gates. They depend on the dev server
// booted with `VITE_E2E_MOCK_API=true` (where MSW serves the mocked data
// they assert against). In preview/CI mode the production bundle has no
// backend or MSW, so the specs would fail spuriously — skip them there.
// `pnpm screenshots` sets `PLAYWRIGHT_MODE=dev` automatically.
const isDevMode = process.env.PLAYWRIGHT_MODE === "dev";

test.describe("screenshots", () => {
	test.skip(!isDevMode, "screenshot specs require PLAYWRIGHT_MODE=dev (MSW-backed dev server)");

	test("captures /teams and /teams/$teamId tabs", async ({ page }) => {
		await page.goto("/teams");
		await expect(page.getByText("Buffalo Bills").first()).toBeVisible({ timeout: 15_000 });
		await page.screenshot({
			path: "docs/screenshots/teams/teams-browse.png",
			fullPage: true,
		});

		// Browse with NFL filter — Mantine SegmentedControl exposes labels as
		// either radio or button elements depending on version; click the label.
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
	});

	test("captures /players and /players/$playerId tabs", async ({ page }) => {
		// Browse — default (all leagues)
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
		// Mantine's Select markup exposes both the input and the listbox under
		// the same accessible label, so reach for the combobox role specifically.
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

		await page.getByRole("tab", { name: "Game Log" }).click();
		await expect(page.getByLabel("Season")).toBeVisible({ timeout: 5_000 });
		await page.screenshot({
			path: "docs/screenshots/players/player-detail-gamelog.png",
			fullPage: true,
		});

		await page.getByRole("tab", { name: "Bio" }).click();
		await expect(page.getByText(/college|date of birth/i).first()).toBeVisible({
			timeout: 5_000,
		});
		await page.screenshot({
			path: "docs/screenshots/players/player-detail-bio.png",
			fullPage: true,
		});

		await page.goto("/players/does-not-exist");
		await expect(page.getByRole("heading", { name: /Player not found/i })).toBeVisible({
			timeout: 15_000,
		});
		await page.screenshot({
			path: "docs/screenshots/players/player-detail-404.png",
			fullPage: true,
		});
	});

	test("captures /games and /games/$gameId tabs", async ({ page }) => {
		// Browse — default (all leagues, all seasons, sorted desc by date)
		await page.goto("/games");
		await expect(page.getByTestId("game-table")).toBeVisible({ timeout: 15_000 });
		await expect(page.locator('[data-testid^="game-row-"]').first()).toBeVisible({
			timeout: 10_000,
		});
		await page.screenshot({
			path: "docs/screenshots/games/games-browse.png",
			fullPage: true,
		});

		// Filtered: NFL + Week 1 — exercises league + week filters together.
		await page.locator("label").filter({ hasText: /^NFL$/ }).first().click();
		await expect(page.locator('[data-testid^="game-row-"]').first()).toBeVisible({
			timeout: 10_000,
		});
		await page.getByRole("combobox", { name: "Week filter" }).click();
		await page.getByRole("option", { name: "Week 1" }).click();
		await expect(page.locator('[data-testid^="game-row-"]').first()).toBeVisible({
			timeout: 10_000,
		});
		await page.screenshot({
			path: "docs/screenshots/games/games-browse-nfl-w1.png",
			fullPage: true,
		});

		// Empty state: filter to a season that doesn't exist in the dataset
		// (placeholder fixtures cover 2023–2025). Drive it through the URL
		// since the Select control is constrained to known seasons.
		await page.goto("/games?league=NFL&season=2020");
		await expect(page.getByText(/no games match/i)).toBeVisible({ timeout: 10_000 });
		await page.screenshot({
			path: "docs/screenshots/games/games-browse-empty.png",
			fullPage: true,
		});

		// Detail page — pick the showcase NFL game (season 2025 / week 1, where
		// the fixture generator emits 150+ plays). The round-robin schedule
		// chooses the matchup deterministically but it isn't hard-coded here;
		// fetch the first row's link from the filtered browse view instead.
		await page.goto("/games?league=NFL&season=2025&week=1");
		const firstGameLink = page
			.locator('[data-testid^="game-row-"]')
			.first()
			.getByRole("link")
			.first();
		await expect(firstGameLink).toBeVisible({ timeout: 10_000 });
		await firstGameLink.click();
		await expect(page.getByTestId("game-hero")).toBeVisible({ timeout: 15_000 });
		// Box Score is the default tab — wait for the team-totals heading.
		await expect(page.getByText(/team totals/i)).toBeVisible({ timeout: 10_000 });
		await page.screenshot({
			path: "docs/screenshots/games/game-detail-box.png",
			fullPage: true,
		});

		await page.getByRole("tab", { name: "Play-by-Play" }).click();
		await expect(page.getByTestId("play-by-play")).toBeVisible({ timeout: 10_000 });
		await expect(page.locator('[data-testid^="drive-header-"]').first()).toBeVisible();
		await page.screenshot({
			path: "docs/screenshots/games/game-detail-pbp.png",
			fullPage: true,
		});

		await page.getByRole("tab", { name: "Film" }).click();
		await expect(page.getByTestId("film-tab-placeholder")).toBeVisible({ timeout: 5_000 });
		await page.screenshot({
			path: "docs/screenshots/games/game-detail-film.png",
			fullPage: true,
		});

		await page.goto("/games/does-not-exist");
		await expect(page.getByRole("heading", { name: /Game not found/i })).toBeVisible({
			timeout: 15_000,
		});
		await page.screenshot({
			path: "docs/screenshots/games/game-detail-404.png",
			fullPage: true,
		});
	});

	test("captures /stats query builder states", async ({ page }) => {
		// Default — Plays entity, no filters, default columns and sort.
		await page.goto("/stats");
		await expect(page.getByTestId("results-table")).toBeVisible({ timeout: 15_000 });
		await expect(page.getByTestId("result-count")).toBeVisible();
		await page.screenshot({
			path: "docs/screenshots/stats/stats-plays-default.png",
			fullPage: true,
		});

		// Filtered: NFL + 3rd downs only — exercises a select + multiselect
		// combo, plus the Apply button instead of refetch-on-change.
		await page.getByLabel("League", { exact: true }).click();
		await page.getByRole("option", { name: "NFL", exact: true }).click();
		await page.getByLabel("Down", { exact: true }).click();
		await page.getByRole("option", { name: "3rd" }).click();
		// Close the multiselect dropdown by clicking on the page heading.
		await page.getByRole("heading", { name: "Stats query builder" }).click();
		await page.getByTestId("apply-button").click();
		await expect(page.getByTestId("results-table")).toBeVisible();
		await page.screenshot({
			path: "docs/screenshots/stats/stats-plays-filtered.png",
			fullPage: true,
		});

		// Empty state — combine filters that have no matches.
		await page.getByLabel("Scoring play only").click();
		await page.getByLabel("Yards gained min").fill("999");
		await page.getByTestId("apply-button").click();
		await expect(page.getByText(/no results/i)).toBeVisible({ timeout: 10_000 });
		await page.screenshot({
			path: "docs/screenshots/stats/stats-plays-empty.png",
			fullPage: true,
		});

		// Switch entity to Players to show the registry-driven UI changes.
		await page.goto("/stats?entity=players");
		await expect(page.getByTestId("results-table")).toBeVisible({ timeout: 15_000 });
		await page.screenshot({
			path: "docs/screenshots/stats/stats-players.png",
			fullPage: true,
		});

		// Export menu open — show CSV/XLSX choices.
		await page.getByTestId("export-button").click();
		await expect(page.getByText("Download CSV")).toBeVisible();
		await expect(page.getByText("Download Excel (.xlsx)")).toBeVisible();
		await page.screenshot({
			path: "docs/screenshots/stats/stats-export-menu.png",
			fullPage: true,
		});
	});
});
