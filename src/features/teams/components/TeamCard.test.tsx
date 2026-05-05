import { renderWithRouter, screen } from "@/test-utils";
import { describe, expect, it } from "vitest";
import type { TeamSummary } from "../types";
import { TeamCard, formatRecord } from "./TeamCard";

const team: TeamSummary = {
	id: "nfl-kc",
	name: "Chiefs",
	location: "Kansas City",
	logoUrl: null,
	league: "NFL",
	currentSeason: 2025,
	record: { wins: 11, losses: 3, ties: 0 },
};

describe("formatRecord", () => {
	it("hides ties when there are none", () => {
		expect(formatRecord({ wins: 11, losses: 3, ties: 0 })).toBe("11-3");
	});

	it("includes ties when present", () => {
		expect(formatRecord({ wins: 9, losses: 4, ties: 1 })).toBe("9-4-1");
	});
});

describe("<TeamCard />", () => {
	it("renders the full team name, league, record, and links to the detail page", async () => {
		renderWithRouter(<TeamCard team={team} />);

		expect(await screen.findByText("Kansas City Chiefs")).toBeInTheDocument();
		expect(screen.getByText("NFL")).toBeInTheDocument();
		expect(screen.getByText(/11-3 · 2025/)).toBeInTheDocument();

		const link = screen.getByTestId("team-card-nfl-kc");
		expect(link.getAttribute("href")).toBe("/teams/nfl-kc");
	});
});
