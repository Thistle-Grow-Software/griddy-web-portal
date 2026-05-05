import { renderWithProviders, screen } from "@/test-utils";
import { describe, expect, it } from "vitest";
import type { PlayerBio } from "../types";
import { BioTab } from "./BioTab";

describe("<BioTab />", () => {
	it("renders provided fields with formatted dates and draft", () => {
		const bio: PlayerBio = {
			dateOfBirth: "1995-03-15",
			birthplace: "Austin, TX",
			college: "Texas",
			draftYear: 2017,
			draftRound: 1,
			draftPick: 10,
		};
		renderWithProviders(<BioTab bio={bio} />);

		expect(screen.getByText("Austin, TX")).toBeInTheDocument();
		expect(screen.getByText("Texas")).toBeInTheDocument();
		expect(screen.getByText(/2017 · Round 1, Pick 10/)).toBeInTheDocument();
	});

	it("collapses to an empty state when every field is missing (UFL/CFL case)", () => {
		const bio: PlayerBio = {
			dateOfBirth: null,
			birthplace: null,
			college: null,
			draftYear: null,
			draftRound: null,
			draftPick: null,
		};
		renderWithProviders(<BioTab bio={bio} />);

		expect(screen.getByText(/no biographical info/i)).toBeInTheDocument();
		// No "—" rendered: the AC says missing data must not show "undefined"
		// strings. The collapsed empty-state path also avoids surfacing "—" five
		// times.
		expect(screen.queryByText("—")).not.toBeInTheDocument();
	});
});
