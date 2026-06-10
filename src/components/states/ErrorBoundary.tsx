import { Anchor, Button, Center, MantineProvider, Stack, Text, Title } from "@mantine/core";
import * as Sentry from "@sentry/react";
import type { PropsWithChildren } from "react";

export type ErrorBoundaryProps = PropsWithChildren<{
	/** Center the fallback in the full viewport (app-level boundary). */
	fullPage?: boolean;
}>;

function Fallback({
	resetError,
	eventId,
	fullPage,
}: {
	resetError: () => void;
	eventId: string | undefined;
	fullPage: boolean;
}) {
	const content = (
		<Center mih={fullPage ? "100vh" : 240} p="md">
			<Stack align="center" gap="md" maw={480}>
				<Title order={1}>Something went wrong</Title>
				<Text c="dimmed" ta="center">
					An unexpected error occurred. Our team has been notified. You can try again or return to
					the home screen.
				</Text>
				<Stack gap="xs" align="center">
					<Button onClick={resetError}>Try again</Button>
					<Button variant="subtle" onClick={() => window.location.assign("/")}>
						Back to home
					</Button>
					<Anchor component="button" size="sm" onClick={() => Sentry.showReportDialog({ eventId })}>
						Report this issue
					</Anchor>
				</Stack>
			</Stack>
		</Center>
	);
	// The app-level boundary sits above the app's MantineProvider (mounted in
	// __root.tsx), so the fullPage fallback must bring its own.
	if (fullPage) {
		return <MantineProvider defaultColorScheme="auto">{content}</MantineProvider>;
	}
	return content;
}

/**
 * Route/app-level error boundary. Caught errors are reported to Sentry (via
 * Sentry's ErrorBoundary) and the user sees an actionable fallback — never a
 * blank screen, never a raw trace.
 */
export function ErrorBoundary({ children, fullPage = false }: ErrorBoundaryProps) {
	return (
		<Sentry.ErrorBoundary
			fallback={({ resetError, eventId }) => (
				<Fallback resetError={resetError} eventId={eventId} fullPage={fullPage} />
			)}
		>
			{children}
		</Sentry.ErrorBoundary>
	);
}
