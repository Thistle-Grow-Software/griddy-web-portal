import { LEAGUES, type League } from "@/features/teams/types";
import { Group, MultiSelect, SegmentedControl, Select, Switch, TextInput } from "@mantine/core";
import { IconSearch } from "@tabler/icons-react";
import { POSITIONS, type Position } from "../types";

const ALL = "all" as const;
export type LeagueOption = League | typeof ALL;
export type PositionOption = Position | typeof ALL;

export type TeamOption = { id: string; name: string };

export function PlayerFilters({
	q,
	league,
	position,
	teamIds,
	active,
	teamOptions,
	onQueryChange,
	onLeagueChange,
	onPositionChange,
	onTeamIdsChange,
	onActiveChange,
}: {
	q: string;
	league: LeagueOption;
	position: PositionOption;
	teamIds: string[];
	active: boolean;
	teamOptions: TeamOption[];
	onQueryChange: (next: string) => void;
	onLeagueChange: (next: LeagueOption) => void;
	onPositionChange: (next: PositionOption) => void;
	onTeamIdsChange: (next: string[]) => void;
	onActiveChange: (next: boolean) => void;
}) {
	const leagueData = [
		{ value: ALL, label: "All" },
		...LEAGUES.map((l) => ({ value: l, label: l })),
	];
	const positionData = [
		{ value: ALL, label: "All positions" },
		...POSITIONS.map((p) => ({ value: p, label: p })),
	];
	const teamData = teamOptions.map((t) => ({ value: t.id, label: t.name }));

	return (
		<Group align="end" wrap="wrap" gap="md">
			<SegmentedControl
				aria-label="League filter"
				value={league}
				onChange={(value) => onLeagueChange(value as LeagueOption)}
				data={leagueData}
			/>
			<Select
				aria-label="Position filter"
				data={positionData}
				value={position}
				onChange={(value) => onPositionChange((value ?? ALL) as PositionOption)}
				w={160}
				allowDeselect={false}
			/>
			<MultiSelect
				aria-label="Team filter"
				placeholder={teamIds.length === 0 ? "All teams" : undefined}
				data={teamData}
				value={teamIds}
				onChange={onTeamIdsChange}
				clearable
				searchable
				w={260}
				comboboxProps={{ withinPortal: true }}
			/>
			<TextInput
				aria-label="Search players"
				placeholder="Search players"
				leftSection={<IconSearch size={14} />}
				value={q}
				onChange={(event) => onQueryChange(event.currentTarget.value)}
				style={{ flex: 1, minWidth: 200 }}
			/>
			<Switch
				aria-label="Active only"
				label="Active only"
				checked={active}
				onChange={(event) => onActiveChange(event.currentTarget.checked)}
			/>
		</Group>
	);
}
