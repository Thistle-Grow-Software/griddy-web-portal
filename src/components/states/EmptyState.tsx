import { Button, Center, Stack, Text, Title } from "@mantine/core";
import type { ReactNode } from "react";

export type EmptyStateProps = {
	/** Optional leading icon, e.g. a Tabler icon sized ~32. */
	icon?: ReactNode;
	title: string;
	description?: ReactNode;
	action?: { label: string; onClick: () => void };
};

/**
 * Standard empty state with an optional CTA. Common variants:
 * - "No results for this filter" — pair with a "Clear filters" action.
 * - "No data available yet" — plain statement, no action.
 * - "Not found" — unknown ID on a detail route; pair with a "Back to <list>" action.
 *
 * Voice: direct, not cutesy. Coaches aren't here for jokes.
 */
export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
	return (
		<Center mih={240} p="md">
			<Stack align="center" gap="xs" maw={420}>
				{icon}
				<Title order={4}>{title}</Title>
				{description ? (
					<Text c="dimmed" ta="center">
						{description}
					</Text>
				) : null}
				{action ? (
					<Button variant="light" onClick={action.onClick}>
						{action.label}
					</Button>
				) : null}
			</Stack>
		</Center>
	);
}
