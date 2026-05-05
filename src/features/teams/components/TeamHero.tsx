import { Avatar, Badge, Group, Skeleton, Stack, Text, Title } from "@mantine/core";
import type { TeamDetail } from "../types";
import { formatRecord } from "./TeamCard";

export function TeamHero({ team }: { team: TeamDetail }) {
	const fullName = `${team.location} ${team.name}`;
	return (
		<Group align="center" gap="lg" wrap="nowrap">
			<Avatar src={team.logoUrl} alt={`${fullName} logo`} size={80} radius="md" color="gray">
				{team.name.slice(0, 2).toUpperCase()}
			</Avatar>
			<Stack gap={4} style={{ minWidth: 0 }}>
				<Title order={2} style={{ wordBreak: "break-word" }}>
					{fullName}
				</Title>
				<Group gap="xs">
					<Badge variant="light">{team.league}</Badge>
					{team.conference ? <Badge variant="outline">{team.conference}</Badge> : null}
					{team.division ? <Badge variant="outline">{team.division}</Badge> : null}
				</Group>
				<Text c="dimmed">
					{team.currentSeason} record: <strong>{formatRecord(team.record)}</strong>
					{team.venue ? ` · ${team.venue}` : ""}
				</Text>
			</Stack>
		</Group>
	);
}

export function TeamHeroSkeleton() {
	return (
		<Group align="center" gap="lg" wrap="nowrap" data-testid="team-hero-skeleton">
			<Skeleton height={80} width={80} radius="md" />
			<Stack gap={6} style={{ flex: 1 }}>
				<Skeleton height={28} width="40%" />
				<Skeleton height={16} width="20%" />
				<Skeleton height={14} width="30%" />
			</Stack>
		</Group>
	);
}
