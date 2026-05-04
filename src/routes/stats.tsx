import { Stack, Text, Title } from "@mantine/core";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/stats")({
	component: StatsRoute,
});

function StatsRoute() {
	return (
		<Stack>
			<Title order={2}>Stats</Title>
			<Text c="dimmed">Stats (placeholder).</Text>
		</Stack>
	);
}
