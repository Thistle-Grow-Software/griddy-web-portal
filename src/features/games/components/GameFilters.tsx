import { LEAGUES, type League } from "@/features/teams/types";
import { Group, MultiSelect, SegmentedControl, Select } from "@mantine/core";
import { GAME_STATUSES, type GameStatus } from "../types";

const ALL = "all" as const;
export type LeagueOption = League | typeof ALL;
export type StatusOption = GameStatus | typeof ALL;

export type TeamOption = { id: string; name: string };

const STATUS_LABELS: Record<GameStatus, string> = {
	scheduled: "Scheduled",
	in_progress: "In progress",
	final: "Final",
};

export function GameFilters({
	league,
	season,
	week,
	teamIds,
	status,
	availableSeasons,
	availableWeeks,
	teamOptions,
	onLeagueChange,
	onSeasonChange,
	onWeekChange,
	onTeamIdsChange,
	onStatusChange,
}: {
	league: LeagueOption;
	season: number | null;
	week: number | null;
	teamIds: string[];
	status: StatusOption;
	availableSeasons: number[];
	availableWeeks: number[];
	teamOptions: TeamOption[];
	onLeagueChange: (next: LeagueOption) => void;
	onSeasonChange: (next: number | null) => void;
	onWeekChange: (next: number | null) => void;
	onTeamIdsChange: (next: string[]) => void;
	onStatusChange: (next: StatusOption) => void;
}) {
	const leagueData = [
		{ value: ALL, label: "All" },
		...LEAGUES.map((l) => ({ value: l, label: l })),
	];
	const seasonData = availableSeasons.map((s) => ({ value: String(s), label: String(s) }));
	const weekData = [
		{ value: "any", label: "Any week" },
		...availableWeeks.map((w) => ({ value: String(w), label: `Week ${w}` })),
	];
	const statusData = [
		{ value: ALL, label: "All" },
		...GAME_STATUSES.map((s) => ({ value: s, label: STATUS_LABELS[s] })),
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
				aria-label="Season filter"
				data={seasonData}
				value={season !== null ? String(season) : null}
				onChange={(value) => onSeasonChange(value ? Number(value) : null)}
				w={120}
				placeholder="Season"
				clearable
			/>
			<Select
				aria-label="Week filter"
				data={weekData}
				value={week !== null ? String(week) : "any"}
				onChange={(value) => onWeekChange(value && value !== "any" ? Number(value) : null)}
				w={140}
				allowDeselect={false}
			/>
			<Select
				aria-label="Status filter"
				data={statusData}
				value={status}
				onChange={(value) => onStatusChange((value ?? ALL) as StatusOption)}
				w={150}
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
		</Group>
	);
}
