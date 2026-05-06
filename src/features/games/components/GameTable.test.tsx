import { renderWithRouter, screen } from "@/test-utils";
import { describe, expect, it } from "vitest";
import type { GameSummary } from "../types";
import { GameTable } from "./GameTable";

const games: GameSummary[] = [
	{
		id: "nfl-2025-w01-nfl-buf-at-nfl-kc",
		league: "NFL",
		season: 2025,
		week: 1,
		date: "2025-09-07T17:00:00Z",
		status: "final",
		homeTeamId: "nfl-kc",
		homeTeamName: "Kansas City Chiefs",
		homeScore: 27,
		awayTeamId: "nfl-buf",
		awayTeamName: "Buffalo Bills",
		awayScore: 24,
	},
	{
		id: "nfl-2025-w02-nfl-sf-at-nfl-sea",
		league: "NFL",
		season: 2025,
		week: 2,
		date: "2025-09-14T20:00:00Z",
		status: "scheduled",
		homeTeamId: "nfl-sea",
		homeTeamName: "Seattle Seahawks",
		homeScore: null,
		awayTeamId: "nfl-sf",
		awayTeamName: "San Francisco 49ers",
		awayScore: null,
	},
];

describe("<GameTable />", () => {
	it("renders matchup links to /games/$gameId, scores, and status badges", async () => {
		renderWithRouter(<GameTable games={games} />);

		// Router renders Link elements asynchronously; await the first one.
		const matchup = await screen.findByRole("link", {
			name: "Buffalo Bills @ Kansas City Chiefs",
		});
		expect(matchup.getAttribute("href")).toBe("/games/nfl-2025-w01-nfl-buf-at-nfl-kc");

		// Final game shows score; scheduled game shows em dash.
		expect(screen.getByText("24 – 27")).toBeInTheDocument();
		expect(screen.getAllByText("—").length).toBeGreaterThan(0);

		// Status badges.
		expect(screen.getByText("Final")).toBeInTheDocument();
		expect(screen.getByText("Scheduled")).toBeInTheDocument();
	});
});
