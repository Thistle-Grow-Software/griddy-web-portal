import { Group, SegmentedControl, Select, TextInput } from "@mantine/core";
import { IconSearch } from "@tabler/icons-react";
import { LEAGUES, type League, type Season } from "../types";

const ALL = "all" as const;

export type LeagueOption = League | typeof ALL;

export function TeamFilters({
	league,
	season,
	q,
	availableSeasons,
	onLeagueChange,
	onSeasonChange,
	onQueryChange,
}: {
	league: LeagueOption;
	season: Season | null;
	q: string;
	availableSeasons: Season[];
	onLeagueChange: (next: LeagueOption) => void;
	onSeasonChange: (next: Season | null) => void;
	onQueryChange: (next: string) => void;
}) {
	const leagueData = [
		{ value: ALL, label: "All" },
		...LEAGUES.map((l) => ({ value: l, label: l })),
	];

	const seasonData = availableSeasons.map((s) => ({ value: String(s), label: String(s) }));

	return (
		<Group align="end" wrap="wrap" gap="md">
			<SegmentedControl
				aria-label="League filter"
				value={league}
				onChange={(value) => onLeagueChange(value as LeagueOption)}
				data={leagueData}
			/>
			<Select
				aria-label="Season filter"
				placeholder="Any season"
				clearable
				data={seasonData}
				value={season === null ? null : String(season)}
				onChange={(value) => onSeasonChange(value === null ? null : Number(value))}
				w={140}
			/>
			<TextInput
				aria-label="Search teams"
				placeholder="Search teams"
				leftSection={<IconSearch size={14} />}
				value={q}
				onChange={(event) => onQueryChange(event.currentTarget.value)}
				style={{ flex: 1, minWidth: 200 }}
			/>
		</Group>
	);
}
