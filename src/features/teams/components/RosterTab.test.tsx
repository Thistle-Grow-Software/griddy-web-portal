import { renderWithRouter, screen, userEvent, waitFor, within } from "@/test-utils";
import { describe, expect, it, vi } from "vitest";

// Stub the network layer — RosterTab tests assert on the table behavior, not
// fetch wiring (which `api.test.ts` covers under the Node env).
vi.mock("@/features/teams/api", () => ({
	fetchTeamRoster: vi.fn().mockResolvedValue([
		{
			id: "p1",
			name: "Player One",
			position: "QB",
			jersey: 1,
			heightInches: 74,
			weightPounds: 220,
		},
		{
			id: "p3",
			name: "Player Three",
			position: "WR",
			jersey: 3,
			heightInches: 72,
			weightPounds: 200,
		},
		{
			id: "p10",
			name: "Player Ten",
			position: "K",
			jersey: 10,
			heightInches: 70,
			weightPounds: 190,
		},
	]),
	fetchTeamDetail: vi.fn(),
	fetchTeamsList: vi.fn(),
	fetchTeamSchedule: vi.fn(),
	fetchTeamStats: vi.fn(),
}));

import { RosterTab } from "./RosterTab";

describe("<RosterTab />", () => {
	it("renders roster rows and toggles sort direction on header click", async () => {
		renderWithRouter(<RosterTab teamId="nfl-kc" active />);

		await waitFor(() => expect(screen.getByRole("table")).toBeInTheDocument(), {
			timeout: 3000,
		});

		// Default sort: jersey ascending — first body row has #1.
		const tbody = () => screen.getByRole("table").querySelector("tbody") as HTMLElement;
		const firstRow = within(tbody()).getAllByRole("row")[0];
		expect(within(firstRow).getByText("1")).toBeInTheDocument();

		// Toggle jersey to descending — first row should now be the highest-numbered.
		const user = userEvent.setup();
		await user.click(screen.getByRole("button", { name: /sort by #/i }));

		const firstRowAfter = within(tbody()).getAllByRole("row")[0];
		expect(within(firstRowAfter).getByText("10")).toBeInTheDocument();
	});

	it("does not fetch when inactive", () => {
		renderWithRouter(<RosterTab teamId="nfl-kc" active={false} />);
		expect(screen.queryByRole("table")).not.toBeInTheDocument();
	});
});
