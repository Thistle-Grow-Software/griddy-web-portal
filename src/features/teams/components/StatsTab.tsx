import { Card, Center, Loader, SimpleGrid, Stack, Text } from "@mantine/core";
import { useTeamStats } from "../hooks";
import { EmptyState } from "./EmptyState";

const STAT_LABELS: Record<string, string> = {
	gamesPlayed: "Games Played",
	pointsFor: "Points For",
	pointsAgainst: "Points Against",
	totalYards: "Total Yards",
	passingYards: "Passing Yards",
	rushingYards: "Rushing Yards",
	turnovers: "Turnovers",
};

export function StatsTab({ teamId, active }: { teamId: string; active: boolean }) {
	const { data, isLoading, isError, error } = useTeamStats(teamId, active);

	if (isLoading) {
		return (
			<Center mih={120}>
				<Loader size="sm" />
			</Center>
		);
	}
	if (isError) {
		return <EmptyState title="Couldn't load stats" description={(error as Error).message} />;
	}
	if (!data) {
		return <EmptyState title="No stats available" />;
	}

	const entries = Object.entries(data) as [keyof typeof data, number][];

	return (
		<SimpleGrid cols={{ base: 2, sm: 3, md: 4 }} spacing="md">
			{entries.map(([key, value]) => (
				<Card key={key} withBorder padding="md" radius="md">
					<Stack gap={2}>
						<Text size="sm" c="dimmed">
							{STAT_LABELS[key] ?? key}
						</Text>
						<Text fz={28} fw={700}>
							{value.toLocaleString()}
						</Text>
					</Stack>
				</Card>
			))}
		</SimpleGrid>
	);
}
