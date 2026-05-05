import { Avatar, Badge, Group, Skeleton, Stack, Text, Title } from "@mantine/core";
import type { PlayerDetail } from "../types";

function heightLabel(inches: number | null): string {
	if (inches === null) return "—";
	return `${Math.floor(inches / 12)}'${inches % 12}"`;
}

export function PlayerHero({ player }: { player: PlayerDetail }) {
	return (
		<Group align="center" gap="lg" wrap="nowrap">
			<Avatar
				src={player.headshotUrl}
				alt={`${player.name} headshot`}
				size={88}
				radius="md"
				color="gray"
			>
				{player.name
					.split(" ")
					.map((part) => part[0])
					.slice(0, 2)
					.join("")
					.toUpperCase()}
			</Avatar>
			<Stack gap={4} style={{ minWidth: 0 }}>
				<Title order={2} style={{ wordBreak: "break-word" }}>
					{player.name}
				</Title>
				<Group gap="xs">
					<Badge variant="light">{player.position}</Badge>
					<Badge variant="outline">{player.league}</Badge>
					{player.active ? (
						<Badge color="green" variant="light">
							Active
						</Badge>
					) : (
						<Badge color="gray" variant="light">
							Inactive
						</Badge>
					)}
				</Group>
				<Text c="dimmed">
					{player.teamName}
					{player.jersey !== null ? ` · #${player.jersey}` : ""}
					{player.heightInches !== null ? ` · ${heightLabel(player.heightInches)}` : ""}
					{player.weightPounds !== null ? ` · ${player.weightPounds} lb` : ""}
				</Text>
			</Stack>
		</Group>
	);
}

export function PlayerHeroSkeleton() {
	return (
		<Group align="center" gap="lg" wrap="nowrap" data-testid="player-hero-skeleton">
			<Skeleton height={88} width={88} radius="md" />
			<Stack gap={6} style={{ flex: 1 }}>
				<Skeleton height={28} width="40%" />
				<Skeleton height={16} width="20%" />
				<Skeleton height={14} width="30%" />
			</Stack>
		</Group>
	);
}
