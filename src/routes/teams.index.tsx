import { Stack, Text, Title } from "@mantine/core";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/teams/")({
	component: TeamsIndex,
});

function TeamsIndex() {
	return (
		<Stack>
			<Title order={2}>Teams</Title>
			<Text c="dimmed">Browse teams (placeholder).</Text>
		</Stack>
	);
}
