import { EmptyState } from "@/features/teams/components/EmptyState";
import { Center, Group, Loader, Select, Stack, Table } from "@mantine/core";
import { Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { usePlayerCareer, usePlayerGameLog } from "../hooks";
import type { PlayerKeyStats, Position } from "../types";

function formatGameDate(iso: string): string {
	return new Date(iso).toLocaleDateString(undefined, {
		month: "short",
		day: "numeric",
		year: "numeric",
	});
}

function statColumns(position: Position): { key: keyof PlayerKeyStats; label: string }[] {
	switch (position) {
		case "QB":
			return [
				{ key: "passYards", label: "Pass yds" },
				{ key: "passTds", label: "Pass TD" },
				{ key: "rushYards", label: "Rush yds" },
			];
		case "RB":
			return [
				{ key: "rushYards", label: "Rush yds" },
				{ key: "rushTds", label: "Rush TD" },
				{ key: "receptions", label: "Rec" },
			];
		case "WR":
		case "TE":
			return [
				{ key: "receptions", label: "Rec" },
				{ key: "recYards", label: "Rec yds" },
			];
		case "DL":
		case "LB":
			return [
				{ key: "tackles", label: "Tkl" },
				{ key: "sacks", label: "Sacks" },
			];
		default:
			return [{ key: "tackles", label: "Tkl" }];
	}
}

export function GameLogTab({
	playerId,
	position,
	currentSeason,
	season,
	onSeasonChange,
	active,
}: {
	playerId: string;
	position: Position;
	currentSeason: number;
	season: number;
	onSeasonChange: (next: number) => void;
	active: boolean;
}) {
	const careerQuery = usePlayerCareer(playerId, active);
	const gameLogQuery = usePlayerGameLog(playerId, season, active);

	const seasonOptions = useMemo(() => {
		const seasons = (careerQuery.data ?? []).map((c) => c.season);
		// Always include the player's current season even if the career payload
		// hasn't loaded yet, so the selector isn't empty during the initial fetch.
		if (!seasons.includes(currentSeason)) seasons.push(currentSeason);
		return seasons
			.slice()
			.sort((a, b) => b - a)
			.map((s) => ({ value: String(s), label: String(s) }));
	}, [careerQuery.data, currentSeason]);

	const cols = statColumns(position);

	return (
		<Stack gap="md">
			<Group>
				<Select
					aria-label="Season"
					data={seasonOptions}
					value={String(season)}
					onChange={(value) => {
						if (value) onSeasonChange(Number(value));
					}}
					allowDeselect={false}
					w={140}
				/>
			</Group>

			{gameLogQuery.isLoading ? (
				<Center mih={120}>
					<Loader size="sm" />
				</Center>
			) : gameLogQuery.isError ? (
				<EmptyState
					title="Couldn't load game log"
					description={(gameLogQuery.error as Error).message}
				/>
			) : !gameLogQuery.data || gameLogQuery.data.length === 0 ? (
				<EmptyState title={`No games on file for ${season}`} />
			) : (
				<Table striped highlightOnHover withTableBorder verticalSpacing="xs">
					<Table.Thead>
						<Table.Tr>
							<Table.Th>Wk</Table.Th>
							<Table.Th>Date</Table.Th>
							<Table.Th>Opp</Table.Th>
							{cols.map((c) => (
								<Table.Th key={c.key}>{c.label}</Table.Th>
							))}
						</Table.Tr>
					</Table.Thead>
					<Table.Tbody>
						{gameLogQuery.data.map((entry) => (
							<Table.Tr key={entry.gameId}>
								<Table.Td>{entry.week}</Table.Td>
								<Table.Td>{formatGameDate(entry.date)}</Table.Td>
								<Table.Td>
									<Link
										to="/games/$gameId"
										params={{ gameId: entry.gameId }}
										style={{ color: "inherit" }}
									>
										{entry.isHome ? "vs." : "@"} {entry.opponentName}
									</Link>
								</Table.Td>
								{cols.map((c) => (
									<Table.Td key={c.key}>
										{entry.stats[c.key] === undefined
											? "—"
											: (entry.stats[c.key] as number).toLocaleString()}
									</Table.Td>
								))}
							</Table.Tr>
						))}
					</Table.Tbody>
				</Table>
			)}
		</Stack>
	);
}
