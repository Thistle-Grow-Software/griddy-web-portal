import { Badge, Group, Skeleton, Stack, Text, Title } from "@mantine/core";
import type { GameDetail, GameStatus } from "../types";

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
		return new Date(iso).toLocaleString(undefined, {
			weekday: "long",
			year: "numeric",
			month: "long",
			day: "numeric",
			hour: "numeric",
			minute: "2-digit",
		});
	} catch {
		return iso;
	}
}

export function GameHero({ game }: { game: GameDetail }) {
	const score =
		game.awayScore === null || game.homeScore === null
			? "—"
			: `${game.awayScore} – ${game.homeScore}`;

	return (
		<Stack gap="xs" data-testid="game-hero">
			<Group gap="sm">
				<Badge color={STATUS_COLORS[game.status]} variant="light">
					{STATUS_LABELS[game.status]}
				</Badge>
				<Badge variant="outline">{game.league}</Badge>
				<Badge variant="default">Week {game.week}</Badge>
				<Badge variant="default">{game.season}</Badge>
			</Group>
			<Title order={2}>
				{game.awayTeamName} @ {game.homeTeamName}
			</Title>
			<Group gap="xl">
				<Text size="xl" fw={700}>
					{score}
				</Text>
				<Text c="dimmed">{formatDate(game.date)}</Text>
			</Group>
			<Group gap="md">
				{game.venue ? <Text size="sm">📍 {game.venue}</Text> : null}
				{game.weather ? (
					<Text size="sm" c="dimmed">
						{game.weather}
					</Text>
				) : null}
			</Group>
		</Stack>
	);
}

export function GameHeroSkeleton() {
	return (
		<Stack gap="xs">
			<Skeleton height={20} width={220} />
			<Skeleton height={32} width={420} />
			<Skeleton height={20} width={280} />
		</Stack>
	);
}
