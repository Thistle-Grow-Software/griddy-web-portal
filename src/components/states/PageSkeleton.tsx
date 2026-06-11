import { Skeleton, Stack } from "@mantine/core";

/**
 * Generic page-level loading scaffold: heading, intro line, then content
 * blocks. Prefer a feature-specific skeleton that mirrors the real layout
 * (see TeamHeroSkeleton) when the final page shape is known — skeletons
 * should match the loaded layout to avoid layout shift.
 */
export function PageSkeleton({
	"data-testid": testId = "page-skeleton",
}: { "data-testid"?: string }) {
	return (
		<Stack gap="lg" data-testid={testId}>
			<Stack gap="xs">
				<Skeleton height={32} width="40%" />
				<Skeleton height={16} width="60%" />
			</Stack>
			<Skeleton height={160} radius="sm" />
			<Skeleton height={160} radius="sm" />
		</Stack>
	);
}
