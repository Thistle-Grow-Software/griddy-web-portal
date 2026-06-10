import { CardSkeleton, EmptyState, InlineError } from "@/components/states";
import { Badge, Card, Group, Stack, Text } from "@mantine/core";
import { Link } from "@tanstack/react-router";
import { useTeamSchedule } from "../hooks";
import type { ScheduleGame } from "../types";

function formatGameDate(iso: string): string {
	const d = new Date(iso);
	return d.toLocaleDateString(undefined, {
		month: "short",
		day: "numeric",
		year: "numeric",
	});
}

function gameSummary(game: ScheduleGame): string {
	if (game.status !== "final") return "vs.";
	const teamWon =
		game.teamScore !== null && game.opponentScore !== null && game.teamScore > game.opponentScore;
	return teamWon ? "W" : "L";
}

function StatusBadge({ status }: { status: ScheduleGame["status"] }) {
	if (status === "final") return <Badge color="gray">Final</Badge>;
	if (status === "in_progress") return <Badge color="green">Live</Badge>;
	return <Badge variant="outline">Scheduled</Badge>;
}

export function ScheduleTab({ teamId, active }: { teamId: string; active: boolean }) {
	const { data, isLoading, isError, error } = useTeamSchedule(teamId, active);

	if (isLoading) {
		return (
			<Stack gap="xs" data-testid="schedule-skeleton">
				{["s1", "s2", "s3", "s4"].map((key) => (
					<CardSkeleton key={key} />
				))}
			</Stack>
		);
	}
	if (isError) {
		return <InlineError title="Couldn't load schedule" message={(error as Error).message} />;
	}
	if (!data || data.length === 0) {
		return <EmptyState title="No games on the schedule yet" />;
	}

	return (
		<Stack gap="xs">
			{data.map((game) => (
				<Link
					key={game.id}
					to="/games/$gameId"
					params={{ gameId: game.id }}
					style={{ textDecoration: "none", color: "inherit" }}
					data-testid={`schedule-game-${game.id}`}
				>
					<Card withBorder padding="sm" radius="md">
						<Group justify="space-between" wrap="wrap" gap="sm">
							<Group gap="sm">
								<Text fw={600}>Week {game.week}</Text>
								<Text c="dimmed">{formatGameDate(game.date)}</Text>
							</Group>
							<Group gap="sm">
								<Text>
									{game.isHome ? "vs." : "@"} {game.opponentName}
								</Text>
								{game.status === "final" ? (
									<Text fw={600}>
										{gameSummary(game)} {game.teamScore}–{game.opponentScore}
									</Text>
								) : null}
								<StatusBadge status={game.status} />
							</Group>
						</Group>
					</Card>
				</Link>
			))}
		</Stack>
	);
}
