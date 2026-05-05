import { Card, Group, Skeleton, Stack } from "@mantine/core";

// Mirrors TeamCard layout exactly — same paddings, avatar size, and typography
// heights — so swapping skeleton → card on data arrival doesn't shift layout.
export function TeamCardSkeleton() {
	return (
		<Card withBorder padding="md" radius="md" data-testid="team-card-skeleton">
			<Group wrap="nowrap" align="center" gap="md">
				<Skeleton height={48} width={48} radius="md" />
				<Stack gap={6} style={{ flex: 1 }}>
					<Skeleton height={16} width="60%" />
					<Skeleton height={12} width="40%" />
				</Stack>
			</Group>
		</Card>
	);
}
