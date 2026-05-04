import { Stack, Text, Title } from "@mantine/core";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/games/$gameId")({
	component: GameDetail,
});

function GameDetail() {
	const { gameId } = Route.useParams();
	return (
		<Stack>
			<Title order={2}>Game {gameId}</Title>
			<Text c="dimmed">Game detail (placeholder).</Text>
		</Stack>
	);
}
