import { Stack, Text, Title } from "@mantine/core";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/teams/$teamId")({
	component: TeamDetail,
});

function TeamDetail() {
	const { teamId } = Route.useParams();
	return (
		<Stack>
			<Title order={2}>Team {teamId}</Title>
			<Text c="dimmed">Team detail (placeholder).</Text>
		</Stack>
	);
}
