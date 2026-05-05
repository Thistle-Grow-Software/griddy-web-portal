import { Avatar, Badge, Card, Group, Stack, Text } from "@mantine/core";
import { Link } from "@tanstack/react-router";
import type { TeamSummary } from "../types";

export function formatRecord(record: TeamSummary["record"]): string {
	return record.ties > 0
		? `${record.wins}-${record.losses}-${record.ties}`
		: `${record.wins}-${record.losses}`;
}

export function TeamCard({ team }: { team: TeamSummary }) {
	const fullName = `${team.location} ${team.name}`;
	// Wrap the Card in Link rather than passing `component={Link}` — Mantine's
	// polymorphic-component prop erases TanStack Router's typed `params`.
	return (
		<Link
			to="/teams/$teamId"
			params={{ teamId: team.id }}
			style={{ textDecoration: "none", color: "inherit" }}
			data-testid={`team-card-${team.id}`}
		>
			<Card withBorder padding="md" radius="md">
				<Group wrap="nowrap" align="center" gap="md">
					<Avatar src={team.logoUrl} alt={`${fullName} logo`} size={48} radius="md" color="gray">
						{team.name.slice(0, 2).toUpperCase()}
					</Avatar>
					<Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
						<Text fw={600} truncate>
							{fullName}
						</Text>
						<Group gap="xs">
							<Badge size="sm" variant="light">
								{team.league}
							</Badge>
							<Text size="sm" c="dimmed">
								{formatRecord(team.record)} · {team.currentSeason}
							</Text>
						</Group>
					</Stack>
				</Group>
			</Card>
		</Link>
	);
}
