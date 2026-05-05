import { Button, Center, Stack, Text, Title } from "@mantine/core";

export function ErrorFallback({ resetError }: { resetError: () => void }) {
	return (
		<Center mih="100vh" p="md">
			<Stack align="center" gap="md" maw={480}>
				<Title order={1}>Something went wrong</Title>
				<Text c="dimmed" ta="center">
					An unexpected error occurred. Our team has been notified. You can try reloading the page
					or returning to the home screen.
				</Text>
				<Stack gap="xs">
					<Button onClick={resetError}>Try again</Button>
					<Button variant="subtle" onClick={() => window.location.assign("/")}>
						Back to home
					</Button>
				</Stack>
			</Stack>
		</Center>
	);
}
