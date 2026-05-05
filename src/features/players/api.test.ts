// @vitest-environment node
// MSW + happy-dom has a known ReadableStream-lock interop bug; run the
// fetch-layer tests under Node where native fetch + Response work cleanly.
import { describe, expect, it } from "vitest";
import {
	_internal,
	fetchPlayerCareer,
	fetchPlayerDetail,
	fetchPlayerGameLog,
	fetchPlayersList,
} from "./api";

describe("buildPlayersListPath", () => {
	it("omits unset query parameters", () => {
		expect(_internal.buildPlayersListPath({})).toBe("/api/players/");
	});

	it("repeats `team` for each id (matches DRF MultipleChoiceFilter)", () => {
		expect(_internal.buildPlayersListPath({ teamIds: ["nfl-kc", "nfl-sf"] })).toBe(
			"/api/players/?team=nfl-kc&team=nfl-sf",
		);
	});

	it("serializes filters and pagination", () => {
		expect(
			_internal.buildPlayersListPath({
				q: "carter",
				league: "NFL",
				position: "QB",
				active: true,
				page: 2,
				pageSize: 50,
			}),
		).toBe("/api/players/?q=carter&league=NFL&position=QB&active=true&page=2&page_size=50");
	});
});

describe("players API (against MSW)", () => {
	it("fetchPlayersList returns league-filtered results", async () => {
		const result = await fetchPlayersList({ league: "NFL", pageSize: 200 });
		expect(result.count).toBeGreaterThan(0);
		expect(result.results.every((p) => p.league === "NFL")).toBe(true);
	});

	it("fetchPlayersList honors position + active filters", async () => {
		const result = await fetchPlayersList({
			league: "NFL",
			position: "QB",
			active: true,
			pageSize: 200,
		});
		expect(result.results.every((p) => p.position === "QB")).toBe(true);
		expect(result.results.every((p) => p.active)).toBe(true);
	});

	it("fetchPlayerDetail returns full detail and bio", async () => {
		const list = await fetchPlayersList({ league: "NFL", pageSize: 1 });
		expect(list.results.length).toBe(1);
		const id = list.results[0].id;
		const detail = await fetchPlayerDetail(id);
		expect(detail.id).toBe(id);
		expect(detail).toHaveProperty("bio");
	});

	it("fetchPlayerDetail throws a 404-tagged error for unknown ids", async () => {
		await expect(fetchPlayerDetail("does-not-exist")).rejects.toMatchObject({
			status: 404,
		});
	});

	it("fetchPlayerCareer returns season-by-season entries", async () => {
		const list = await fetchPlayersList({ league: "NFL", pageSize: 1 });
		const id = list.results[0].id;
		const career = await fetchPlayerCareer(id);
		expect(career.length).toBeGreaterThan(0);
		expect(career[0]).toHaveProperty("season");
		expect(career[0]).toHaveProperty("gamesPlayed");
	});

	it("fetchPlayerGameLog returns per-game entries for the requested season", async () => {
		const list = await fetchPlayersList({ league: "NFL", pageSize: 1 });
		const id = list.results[0].id;
		const log = await fetchPlayerGameLog(id, 2025);
		expect(log.length).toBeGreaterThan(0);
		expect(log[0]).toHaveProperty("week");
	});
});
