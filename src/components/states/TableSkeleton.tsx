import { Skeleton, Stack } from "@mantine/core";

export type TableSkeletonProps = {
	/** Number of body rows. Match the expected page size to avoid layout shift. */
	rows?: number;
	"data-testid"?: string;
};

/**
 * Rectangle-striped placeholder sized to match a data table: one header row
 * plus `rows` body rows.
 */
export function TableSkeleton({
	rows = 10,
	"data-testid": testId = "table-skeleton",
}: TableSkeletonProps) {
	const rowKeys = Array.from({ length: rows }, (_, index) => `row-${index}`);
	return (
		<Stack gap={6} data-testid={testId}>
			<Skeleton height={36} radius="sm" />
			{rowKeys.map((key) => (
				<Skeleton key={key} height={40} radius="sm" data-testid={`${testId}-row`} />
			))}
		</Stack>
	);
}
