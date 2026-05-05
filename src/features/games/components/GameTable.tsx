import { Badge, Table, Text } from "@mantine/core";
import { Link } from "@tanstack/react-router";
import type { GameStatus, GameSummary } from "../types";

const STATUS_COLORS: Record<GameStatus, string> = {
	scheduled: "gray",
	in_progress: "yellow",
	final: "green",
};

const STATUS_LABELS: Record<GameStatus, string> = {
	scheduled: "Scheduled",
	in_progress: "Live",
	final: "Final",
};

function formatDate(iso: string): string {
	try {
		return new Date(iso).toLocaleDateString(undefined, {
			weekday: "short",
			year: "numeric",
			month: "short",
			day: "numeric",
		});
	} catch {
		return iso;
	}
}

function formatScore(game: GameSummary): string {
	if (game.awayScore === null || game.homeScore === null) return "—";
	return `${game.awayScore} – ${game.homeScore}`;
}

export function GameTable({ games }: { games: GameSummary[] }) {
	return (
		<Table
			highlightOnHover
			withTableBorder
			verticalSpacing="sm"
			data-testid="game-table"
			aria-label="Games"
		>
			<Table.Thead>
				<Table.Tr>
					<Table.Th>Date</Table.Th>
					<Table.Th>Matchup</Table.Th>
					<Table.Th>Score</Table.Th>
					<Table.Th>Week</Table.Th>
					<Table.Th>League</Table.Th>
					<Table.Th>Status</Table.Th>
				</Table.Tr>
			</Table.Thead>
			<Table.Tbody>
				{games.map((game) => (
					<Table.Tr key={game.id} data-testid={`game-row-${game.id}`}>
						<Table.Td>
							<Text size="sm">{formatDate(game.date)}</Text>
						</Table.Td>
						<Table.Td>
							<Link
								to="/games/$gameId"
								params={{ gameId: game.id }}
								style={{ color: "inherit", textDecoration: "none", fontWeight: 500 }}
							>
								{game.awayTeamName} @ {game.homeTeamName}
							</Link>
						</Table.Td>
						<Table.Td>
							<Text size="sm" fw={600}>
								{formatScore(game)}
							</Text>
						</Table.Td>
						<Table.Td>
							<Text size="sm">Week {game.week}</Text>
						</Table.Td>
						<Table.Td>
							<Badge size="xs" variant="outline">
								{game.league}
							</Badge>
						</Table.Td>
						<Table.Td>
							<Badge size="xs" color={STATUS_COLORS[game.status]} variant="light">
								{STATUS_LABELS[game.status]}
							</Badge>
						</Table.Td>
					</Table.Tr>
				))}
			</Table.Tbody>
		</Table>
	);
}
