// @vitest-environment node
// MSW handler tests run under Node — see src/mocks/handlers.test.ts for the
// rationale (happy-dom + MSW ReadableStream incompatibility).
import { describe, expect, it } from "vitest";
import {
	_internal,
	fetchTeamDetail,
	fetchTeamRoster,
	fetchTeamSchedule,
	fetchTeamStats,
	fetchTeamsList,
} from "./api";

describe("buildTeamsListPath", () => {
	it("omits unset query parameters", () => {
		expect(_internal.buildTeamsListPath({})).toBe("/api/teams/");
	});

	it("serializes provided filters and pagination", () => {
		expect(
			_internal.buildTeamsListPath({
				league: "NFL",
				season: 2025,
				q: "chiefs",
				page: 2,
				pageSize: 20,
			}),
		).toBe("/api/teams/?league=NFL&season=2025&q=chiefs&page=2&page_size=20");
	});
});

describe("teams API (against MSW)", () => {
	it("fetchTeamsList returns paginated, league-scoped results", async () => {
		const result = await fetchTeamsList({ league: "NFL", pageSize: 50 });
		expect(result.count).toBeGreaterThan(0);
		expect(result.results.every((t) => t.league === "NFL")).toBe(true);
		expect(result.availableSeasons.NFL.length).toBeGreaterThan(0);
	});

	it("fetchTeamsList honors search query", async () => {
		const result = await fetchTeamsList({ q: "chiefs" });
		expect(result.results.length).toBe(1);
		expect(result.results[0].id).toBe("nfl-kc");
	});

	it("fetchTeamDetail returns full detail for a real team", async () => {
		const detail = await fetchTeamDetail("nfl-kc");
		expect(detail.id).toBe("nfl-kc");
		expect(detail.conference).toBe("AFC");
		expect(detail.venue).toBe("Arrowhead Stadium");
	});

	it("fetchTeamDetail throws a 404-tagged error for unknown teams", async () => {
		await expect(fetchTeamDetail("does-not-exist")).rejects.toMatchObject({ status: 404 });
	});

	it("fetchTeamRoster, fetchTeamSchedule, fetchTeamStats all return data", async () => {
		const [roster, schedule, stats] = await Promise.all([
			fetchTeamRoster("nfl-kc"),
			fetchTeamSchedule("nfl-kc"),
			fetchTeamStats("nfl-kc"),
		]);
		expect(roster.length).toBeGreaterThan(0);
		expect(schedule.length).toBeGreaterThan(0);
		expect(stats.gamesPlayed).toBeGreaterThan(0);
	});
});
