import { renderWithRouter, screen } from "@/test-utils";
import { describe, expect, it, vi } from "vitest";
import type { PlayerSummary } from "../types";

// happy-dom doesn't compute real layout, so the virtualizer's measurements
// come back as 0 and it skips rendering rows. Stub it to materialize every
// row — the rendering logic is what we're testing here, not the windowing.
vi.mock("@tanstack/react-virtual", () => ({
	useVirtualizer: ({ count }: { count: number }) => ({
		getVirtualItems: () =>
			Array.from({ length: count }, (_, i) => ({
				index: i,
				start: i * 48,
				end: (i + 1) * 48,
				size: 48,
				key: i,
				lane: 0,
			})),
		getTotalSize: () => count * 48,
		measureElement: () => undefined,
	}),
}));

import { VirtualPlayerTable } from "./VirtualPlayerTable";

const players: PlayerSummary[] = [
	{
		id: "p1",
		name: "James Carter",
		position: "QB",
		jersey: 1,
		teamId: "nfl-kc",
		teamName: "Kansas City Chiefs",
		league: "NFL",
		active: true,
		currentSeason: 2025,
		keyStats: { passYards: 4200, passTds: 32 },
	},
	{
		id: "p2",
		name: "Marcus Hill",
		position: "WR",
		jersey: 11,
		teamId: "nfl-sf",
		teamName: "San Francisco 49ers",
		league: "NFL",
		active: false,
		currentSeason: 2025,
		keyStats: { receptions: 78, recYards: 1024 },
	},
];

describe("<VirtualPlayerTable />", () => {
	it("renders rows with name links, position, team, and stats", async () => {
		renderWithRouter(<VirtualPlayerTable players={players} />);

		const carter = await screen.findByRole("link", { name: "James Carter" });
		expect(carter.getAttribute("href")).toBe("/players/p1");

		expect(screen.getByText(/4,200 pass yds · 32 TD/)).toBeInTheDocument();
		expect(screen.getByText(/78 rec · 1,024 yds/)).toBeInTheDocument();

		expect(screen.getByText("Active")).toBeInTheDocument();
		expect(screen.getByText("Inactive")).toBeInTheDocument();
	});
});
