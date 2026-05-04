import { Stack, Text, Title } from "@mantine/core";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/games/")({
	component: GamesIndex,
});

function GamesIndex() {
	return (
		<Stack>
			<Title order={2}>Games</Title>
			<Text c="dimmed">Browse games (placeholder).</Text>
		</Stack>
	);
}
