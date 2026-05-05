import { renderWithProviders, screen, userEvent } from "@/test-utils";
import { describe, expect, it, vi } from "vitest";
import { TeamFilters } from "./TeamFilters";

describe("<TeamFilters />", () => {
	it("calls onLeagueChange when a league is selected", async () => {
		const onLeagueChange = vi.fn();
		const user = userEvent.setup();

		renderWithProviders(
			<TeamFilters
				league="all"
				season={null}
				q=""
				availableSeasons={[2025, 2024]}
				onLeagueChange={onLeagueChange}
				onSeasonChange={vi.fn()}
				onQueryChange={vi.fn()}
			/>,
		);

		await user.click(screen.getByRole("radio", { name: "NFL" }));
		expect(onLeagueChange).toHaveBeenCalledWith("NFL");
	});

	it("forwards search input to onQueryChange", async () => {
		const onQueryChange = vi.fn();
		const user = userEvent.setup();

		renderWithProviders(
			<TeamFilters
				league="all"
				season={null}
				q=""
				availableSeasons={[2025]}
				onLeagueChange={vi.fn()}
				onSeasonChange={vi.fn()}
				onQueryChange={onQueryChange}
			/>,
		);

		await user.type(screen.getByLabelText("Search teams"), "k");
		// Input is fully controlled — parent owns `q`. We don't simulate the
		// parent updating, so we just assert the change is forwarded.
		expect(onQueryChange).toHaveBeenCalledTimes(1);
		expect(onQueryChange).toHaveBeenCalledWith("k");
	});
});
