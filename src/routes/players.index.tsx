import { Stack, Text, Title } from "@mantine/core";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/players/")({
	component: PlayersIndex,
});

function PlayersIndex() {
	return (
		<Stack>
			<Title order={2}>Players</Title>
			<Text c="dimmed">Browse players (placeholder).</Text>
		</Stack>
	);
}
