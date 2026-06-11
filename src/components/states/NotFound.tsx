import { Button, Stack, Text, Title } from "@mantine/core";
import { Link } from "@tanstack/react-router";

export type NotFoundProps = {
	title?: string;
	message?: string;
};

/** 404 surface for unknown routes and unknown IDs. */
export function NotFound({
	title = "404",
	message = "We couldn't find that page.",
}: NotFoundProps) {
	return (
		<Stack align="center" gap="md" mt="xl">
			<Title order={1}>{title}</Title>
			<Text c="dimmed">{message}</Text>
			<Button component={Link} to="/">
				Back to home
			</Button>
		</Stack>
	);
}
