import { describe, expect, it } from "vitest";
import { buildCsv, buildExportFilename } from "./export";
import type { ColumnDef } from "./types";

const cols: ColumnDef[] = [
	{ id: "name", label: "Name" },
	{ id: "yards", label: "Yards", numeric: true },
	{ id: "scoring", label: "Scoring?" },
];

describe("buildExportFilename", () => {
	it("uses entity, ISO timestamp without colons, and extension", () => {
		const name = buildExportFilename("plays", "csv", new Date("2026-04-20T15:30:00.000Z"));
		expect(name).toBe("plays-2026-04-20T15-30-00.csv");
	});

	it("supports xlsx extension", () => {
		const name = buildExportFilename("players", "xlsx", new Date("2026-01-02T08:09:10.000Z"));
		expect(name).toBe("players-2026-01-02T08-09-10.xlsx");
	});
});

describe("buildCsv", () => {
	it("emits header row and respects column order", () => {
		const csv = buildCsv([{ name: "Carter", yards: 12, scoring: false }], cols);
		expect(csv).toBe("Name,Yards,Scoring?\nCarter,12,false\n");
	});

	it("ignores fields not in the column selection", () => {
		const csv = buildCsv([{ name: "Carter", yards: 5, scoring: true, secret: "leak" }], cols);
		expect(csv).not.toContain("leak");
	});

	it("escapes commas, quotes, and newlines", () => {
		const csv = buildCsv([{ name: 'Carter, "the kid"', yards: 0, scoring: "yes\nno" }], cols);
		expect(csv).toBe('Name,Yards,Scoring?\n"Carter, ""the kid""",0,"yes\nno"\n');
	});

	it("renders nullish cells as empty strings", () => {
		const csv = buildCsv([{ name: null, yards: undefined, scoring: false }], cols);
		expect(csv).toBe("Name,Yards,Scoring?\n,,false\n");
	});
});
