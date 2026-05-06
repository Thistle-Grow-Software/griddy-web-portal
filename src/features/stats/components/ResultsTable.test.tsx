import { TestProviders } from "@/test-utils";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { ColumnDef } from "../types";

// happy-dom doesn't compute layout — virtualizer reports 0 visible rows.
// Stub it to materialize every row so we can assert content.
vi.mock("@tanstack/react-virtual", () => ({
	useVirtualizer: ({ count }: { count: number }) => ({
		getVirtualItems: () =>
			Array.from({ length: count }, (_, i) => ({
				index: i,
				start: i * 36,
				end: (i + 1) * 36,
				size: 36,
				key: i,
				lane: 0,
			})),
		getTotalSize: () => count * 36,
		measureElement: () => undefined,
	}),
}));

import { ResultsTable } from "./ResultsTable";

const cols: ColumnDef[] = [
	{ id: "name", label: "Name" },
	{ id: "yards", label: "Yards", numeric: true },
	{ id: "scoring", label: "Scoring?" },
];

describe("<ResultsTable />", () => {
	it("renders one row per data item using the column selection", () => {
		render(
			<TestProviders>
				<ResultsTable
					rows={[
						{ name: "Carter", yards: 12, scoring: true },
						{ name: "Hill", yards: 0, scoring: false },
					]}
					columns={cols}
				/>
			</TestProviders>,
		);

		expect(screen.getByText("Carter")).toBeInTheDocument();
		expect(screen.getByText("Hill")).toBeInTheDocument();
		expect(screen.getByText("Yes")).toBeInTheDocument();
		expect(screen.getByText("No")).toBeInTheDocument();
	});

	it("formats null/undefined cells as em dash", () => {
		render(
			<TestProviders>
				<ResultsTable
					rows={[{ name: "Edge case", yards: null, scoring: undefined }]}
					columns={cols}
				/>
			</TestProviders>,
		);
		// Two em dashes — one for `yards`, one for `scoring`.
		expect(screen.getAllByText("—").length).toBe(2);
	});
});
