import { EmptyState } from "@/features/teams/components/EmptyState";
import { Center, Loader, Stack, Table, Text } from "@mantine/core";
import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { usePlayerCareer } from "../hooks";
import type { CareerSeason, PlayerKeyStats, Position } from "../types";

/**
 * The chart shows whichever stat best characterizes the player's position.
 * Falls back to a flat "Games played" series for positions where we don't
 * track a single headline number.
 */
function chartConfigFor(position: Position): {
	key: keyof PlayerKeyStats | "gamesPlayed";
	label: string;
} {
	switch (position) {
		case "QB":
			return { key: "passYards", label: "Passing yards" };
		case "RB":
			return { key: "rushYards", label: "Rushing yards" };
		case "WR":
		case "TE":
			return { key: "recYards", label: "Receiving yards" };
		case "DL":
		case "LB":
			return { key: "tackles", label: "Tackles" };
		default:
			return { key: "gamesPlayed", label: "Games played" };
	}
}

function statValue(season: CareerSeason, key: keyof PlayerKeyStats | "gamesPlayed"): number {
	if (key === "gamesPlayed") return season.gamesPlayed;
	return season.stats[key] ?? 0;
}

export function CareerStatsTab({
	playerId,
	position,
	active,
}: {
	playerId: string;
	position: Position;
	active: boolean;
}) {
	const { data, isLoading, isError, error } = usePlayerCareer(playerId, active);

	const chart = useMemo(() => chartConfigFor(position), [position]);

	const chartData = useMemo(
		() =>
			(data ?? []).map((season) => ({
				season: String(season.season),
				value: statValue(season, chart.key),
				league: season.league,
			})),
		[data, chart.key],
	);

	if (isLoading) {
		return (
			<Center mih={120}>
				<Loader size="sm" />
			</Center>
		);
	}
	if (isError) {
		return <EmptyState title="Couldn't load career stats" description={(error as Error).message} />;
	}
	if (!data || data.length === 0) {
		return <EmptyState title="No career data on file" />;
	}

	return (
		<Stack gap="md">
			<Stack gap={4}>
				<Text fw={600}>{chart.label} by season</Text>
				<div style={{ width: "100%", height: 240 }}>
					<ResponsiveContainer>
						<BarChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
							<CartesianGrid strokeDasharray="3 3" />
							<XAxis dataKey="season" />
							<YAxis />
							<Tooltip
								formatter={(value) => [
									typeof value === "number" ? value.toLocaleString() : String(value),
									chart.label,
								]}
								labelFormatter={(label) => `Season ${label}`}
							/>
							<Bar dataKey="value" fill="var(--mantine-color-blue-6)" />
						</BarChart>
					</ResponsiveContainer>
				</div>
			</Stack>

			<Table striped withTableBorder verticalSpacing="xs">
				<Table.Thead>
					<Table.Tr>
						<Table.Th>Season</Table.Th>
						<Table.Th>League</Table.Th>
						<Table.Th>Team</Table.Th>
						<Table.Th>GP</Table.Th>
						<Table.Th>{chart.label}</Table.Th>
					</Table.Tr>
				</Table.Thead>
				<Table.Tbody>
					{data.map((season) => (
						<Table.Tr key={`${season.season}-${season.teamId}`}>
							<Table.Td>{season.season}</Table.Td>
							<Table.Td>{season.league}</Table.Td>
							<Table.Td>{season.teamName}</Table.Td>
							<Table.Td>{season.gamesPlayed}</Table.Td>
							<Table.Td>{statValue(season, chart.key).toLocaleString()}</Table.Td>
						</Table.Tr>
					))}
				</Table.Tbody>
			</Table>
		</Stack>
	);
}
