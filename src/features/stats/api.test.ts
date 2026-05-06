// @vitest-environment node
// MSW + happy-dom has a known ReadableStream-lock interop bug; run the
// fetch-layer tests under Node where native fetch + Response work cleanly.
import { describe, expect, it } from "vitest";
import { _internal, encodeFilters, fetchStatsQuery } from "./api";
import type { FilterValues } from "./types";

describe("encodeFilters", () => {
	it("emits select / multiselect / text / boolean / range correctly", () => {
		const filters: FilterValues = {
			league: { kind: "select", value: "NFL" },
			down: { kind: "multiselect", values: ["3", "4"] },
			team: { kind: "text", value: "  nfl-kc  " },
			scoring: { kind: "boolean", value: true },
			yards: { kind: "number-range", min: 5, max: null },
		};
		const params = encodeFilters(filters);
		expect(params.get("league")).toBe("NFL");
		expect(params.getAll("down")).toEqual(["3", "4"]);
		expect(params.get("team")).toBe("nfl-kc");
		expect(params.get("scoring")).toBe("true");
		expect(params.get("yards_min")).toBe("5");
		expect(params.has("yards_max")).toBe(false);
	});

	it("omits empty / unset filter values", () => {
		const filters: FilterValues = {
			league: { kind: "select", value: null },
			down: { kind: "multiselect", values: [] },
			team: { kind: "text", value: "" },
			scoring: { kind: "boolean", value: false },
		};
		const params = encodeFilters(filters);
		expect(params.toString()).toBe("");
	});
});

describe("buildStatsQueryPath", () => {
	it("includes entity, sort, dir, and pagination", () => {
		expect(
			_internal.buildStatsQueryPath({
				entity: "plays",
				filters: {},
				sort: { id: "yards", direction: "desc" },
				page: 2,
				pageSize: 100,
			}),
		).toBe("/api/stats/query/?entity=plays&sort=yards&dir=desc&page=2&page_size=100");
	});
});

describe("stats API (against MSW)", () => {
	it("plays — no filters returns the full dataset (10k+ rows)", async () => {
		// AC: large result sets (10k+ rows) shouldn't lock up the browser. We
		// also use this as a fixture-volume guard so future fixture changes
		// don't silently drop us below the threshold.
		const result = await fetchStatsQuery({
			entity: "plays",
			filters: {},
			sort: { id: "yards", direction: "desc" },
			pageSize: 1, // we only need the count, not the rows
		});
		expect(result.entity).toBe("plays");
		expect(result.count).toBeGreaterThanOrEqual(10_000);
		expect(typeof result.queryMs).toBe("number");
	});

	it("plays — applies league filter and multi-select for downs", async () => {
		const result = await fetchStatsQuery({
			entity: "plays",
			filters: {
				league: { kind: "select", value: "NFL" },
				down: { kind: "multiselect", values: ["3"] },
			},
			sort: { id: "yards", direction: "desc" },
			pageSize: 200,
		});
		expect(result.results.every((r) => r.league === "NFL")).toBe(true);
		expect(result.results.every((r) => r.down === 3)).toBe(true);
	});

	it("plays — sort honors the requested direction", async () => {
		const desc = await fetchStatsQuery({
			entity: "plays",
			filters: {},
			sort: { id: "yards", direction: "desc" },
			pageSize: 5,
		});
		const yards = desc.results.map((r) => r.yards as number);
		const sorted = [...yards].sort((a, b) => b - a);
		expect(yards).toEqual(sorted);
	});

	it("players — name search narrows results", async () => {
		const result = await fetchStatsQuery({
			entity: "players",
			filters: { q: { kind: "text", value: "carter" } },
			sort: { id: "name", direction: "asc" },
			pageSize: 200,
		});
		expect(result.results.every((r) => String(r.name).toLowerCase().includes("carter"))).toBe(true);
	});

	it("teams — league filter scopes to one league", async () => {
		const result = await fetchStatsQuery({
			entity: "teams",
			filters: { league: { kind: "select", value: "NFL" } },
			sort: { id: "displayName", direction: "asc" },
			pageSize: 200,
		});
		expect(result.results.every((r) => r.league === "NFL")).toBe(true);
	});

	it("games — week filter scopes to a single week", async () => {
		const result = await fetchStatsQuery({
			entity: "games",
			filters: {
				league: { kind: "select", value: "NFL" },
				week: { kind: "text", value: "1" },
			},
			sort: { id: "date", direction: "desc" },
			pageSize: 200,
		});
		expect(result.results.length).toBeGreaterThan(0);
		expect(result.results.every((r) => r.week === 1)).toBe(true);
	});
});
