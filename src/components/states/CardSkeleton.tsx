import { Card, Group, Skeleton, Stack } from "@mantine/core";

/**
 * Placeholder for list/grid card views: avatar + two text lines, mirroring
 * the dimensions of cards like TeamCard so swapping skeleton → card on data
 * arrival doesn't shift layout.
 */
export function CardSkeleton({
	"data-testid": testId = "card-skeleton",
}: { "data-testid"?: string }) {
	return (
		<Card withBorder padding="md" radius="md" data-testid={testId}>
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
