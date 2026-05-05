import { Button, Center, Stack, Text, Title } from "@mantine/core";
import type { ReactNode } from "react";

// Local empty-state shell. TGF-336 will replace this with a shared component
// once it lands; the call-sites here will keep working since the shape is
// title + description + optional action.
export function EmptyState({
	title,
	description,
	action,
}: {
	title: string;
	description?: ReactNode;
	action?: { label: string; onClick: () => void };
}) {
	return (
		<Center mih={240} p="md">
			<Stack align="center" gap="xs" maw={420}>
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
