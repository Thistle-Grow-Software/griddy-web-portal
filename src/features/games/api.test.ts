// @vitest-environment node
// MSW + happy-dom has a known ReadableStream-lock interop bug; run the
// fetch-layer tests under Node where native fetch + Response work cleanly.
import { describe, expect, it } from "vitest";
import {
	_internal,
	fetchGameBoxScore,
	fetchGameDetail,
	fetchGamePlayByPlay,
	fetchGamesList,
} from "./api";

describe("buildGamesListPath", () => {
	it("omits unset query parameters", () => {
		expect(_internal.buildGamesListPath({})).toBe("/api/games/");
	});

	it("repeats `team` for each id (matches DRF MultipleChoiceFilter)", () => {
		expect(_internal.buildGamesListPath({ teamIds: ["nfl-kc", "nfl-buf"] })).toBe(
			"/api/games/?team=nfl-kc&team=nfl-buf",
		);
	});

	it("serializes filters and pagination", () => {
		expect(
			_internal.buildGamesListPath({
				league: "NFL",
				season: 2025,
				week: 1,
				status: "final",
				page: 2,
				pageSize: 25,
			}),
		).toBe("/api/games/?league=NFL&season=2025&week=1&status=final&page=2&page_size=25");
	});
});

describe("games API (against MSW)", () => {
	it("fetchGamesList returns league-filtered results", async () => {
		const result = await fetchGamesList({ league: "NFL", pageSize: 200 });
		expect(result.count).toBeGreaterThan(0);
		expect(result.results.every((g) => g.league === "NFL")).toBe(true);
		// Sorted by date desc — first item's date >= last item's date.
		const dates = result.results.map((g) => g.date);
		const sorted = [...dates].sort().reverse();
		expect(dates).toEqual(sorted);
	});

	it("fetchGamesList honors season + week filters", async () => {
		const result = await fetchGamesList({ league: "NFL", season: 2025, week: 1, pageSize: 200 });
		expect(result.results.length).toBeGreaterThan(0);
		expect(result.results.every((g) => g.season === 2025 && g.week === 1)).toBe(true);
	});

	it("fetchGamesList honors team filter (home OR away)", async () => {
		const result = await fetchGamesList({ teamIds: ["nfl-kc"], pageSize: 200 });
		expect(result.results.length).toBeGreaterThan(0);
		expect(
			result.results.every((g) => g.homeTeamId === "nfl-kc" || g.awayTeamId === "nfl-kc"),
		).toBe(true);
	});

	it("fetchGameDetail returns full detail with venue/weather", async () => {
		const list = await fetchGamesList({ league: "NFL", pageSize: 1 });
		const id = list.results[0].id;
		const detail = await fetchGameDetail(id);
		expect(detail.id).toBe(id);
		expect(detail).toHaveProperty("venue");
		expect(detail).toHaveProperty("weather");
	});

	it("fetchGameDetail throws a 404-tagged error for unknown ids", async () => {
		await expect(fetchGameDetail("does-not-exist")).rejects.toMatchObject({
			status: 404,
		});
	});

	it("fetchGameBoxScore returns home + away sides for a final game", async () => {
		const list = await fetchGamesList({ league: "NFL", status: "final", pageSize: 1 });
		const id = list.results[0].id;
		const box = await fetchGameBoxScore(id);
		expect(box.home.totals.teamId).toBeTruthy();
		expect(box.away.totals.teamId).toBeTruthy();
		expect(box.home.players.length).toBeGreaterThan(0);
	});

	it("fetchGamePlayByPlay returns 150+ plays for the showcase game", async () => {
		// Featured games are at season=2025, week=1 in each league per the
		// fixture generator. Pull one and assert volume so the AC ("scrolls
		// smoothly even for games with 150+ plays") has a fixture-level guard.
		const list = await fetchGamesList({ league: "NFL", season: 2025, week: 1, pageSize: 1 });
		const id = list.results[0].id;
		const pbp = await fetchGamePlayByPlay(id);
		const totalPlays = pbp.drives.reduce((sum, d) => sum + d.plays.length, 0);
		expect(totalPlays).toBeGreaterThanOrEqual(150);
	});
});
