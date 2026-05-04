import { Stack, Text, Title } from "@mantine/core";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/players/$playerId")({
	component: PlayerDetail,
});

function PlayerDetail() {
	const { playerId } = Route.useParams();
	return (
		<Stack>
			<Title order={2}>Player {playerId}</Title>
			<Text c="dimmed">Player detail (placeholder).</Text>
		</Stack>
	);
}
