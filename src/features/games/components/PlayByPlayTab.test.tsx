import { TestProviders } from "@/test-utils";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { PlayByPlay } from "../types";

// happy-dom doesn't compute real layout, so the virtualizer's measurements
// come back as 0 and it skips rendering rows. Stub it to materialize every
// row — we're testing rendering, not the windowing math.
vi.mock("@tanstack/react-virtual", () => ({
	useVirtualizer: ({ count }: { count: number }) => ({
		getVirtualItems: () =>
			Array.from({ length: count }, (_, i) => ({
				index: i,
				start: i * 60,
				end: (i + 1) * 60,
				size: 60,
				key: i,
				lane: 0,
			})),
		getTotalSize: () => count * 60,
		measureElement: () => undefined,
	}),
}));

vi.mock("../hooks", () => ({
	useGamePlayByPlay: () => ({
		data: {
			gameId: "g1",
			drives: [
				{
					id: "g1-d0",
					possessionTeamId: "nfl-kc",
					possessionTeamName: "Kansas City Chiefs",
					quarter: 1,
					startClock: "15:00",
					outcome: "Touchdown",
					plays: [
						{
							id: "g1-d0-p0",
							driveId: "g1-d0",
							quarter: 1,
							gameClock: "14:32",
							possessionTeamId: "nfl-kc",
							down: 1,
							distance: 10,
							yardLine: "HOME 25",
							description: "Rush up the middle for 4 yards.",
							yards: 4,
							result: "rush",
							scoringPlay: false,
						},
						{
							id: "g1-d0-p1",
							driveId: "g1-d0",
							quarter: 1,
							gameClock: "14:01",
							possessionTeamId: "nfl-kc",
							down: 2,
							distance: 6,
							yardLine: "HOME 29",
							description: "Touchdown!",
							yards: 12,
							result: "touchdown",
							scoringPlay: true,
						},
					],
				},
			],
		} satisfies PlayByPlay,
		isLoading: false,
		isError: false,
	}),
}));

import { PlayByPlayTab } from "./PlayByPlayTab";

describe("<PlayByPlayTab />", () => {
	it("renders drive header + plays with the expected counts", () => {
		render(
			<TestProviders>
				<PlayByPlayTab gameId="g1" active />
			</TestProviders>,
		);

		expect(screen.getByText("1 drives · 2 plays")).toBeInTheDocument();
		expect(screen.getByTestId("drive-header-g1-d0")).toHaveTextContent("Kansas City Chiefs");
		expect(screen.getByTestId("drive-header-g1-d0")).toHaveTextContent("Touchdown");
		expect(screen.getByTestId("play-g1-d0-p0")).toHaveTextContent(/Rush up the middle/);
		expect(screen.getByTestId("play-g1-d0-p1")).toHaveTextContent(/Touchdown!/);
	});
});
