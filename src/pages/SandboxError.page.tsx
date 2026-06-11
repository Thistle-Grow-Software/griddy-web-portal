import { ErrorBoundary } from "@/components/states";
import { Badge, Button, Card, Group, Stack, Text, Title } from "@mantine/core";
import { useState } from "react";

/**
 * Throws during render when armed. Rendered inside its own ErrorBoundary so
 * the error is captured by Sentry's boundary deterministically (TanStack
 * Router's route-level catch boundary never sees it) and the rest of the
 * page stays interactive.
 */
function CrashOnRender({ crash }: { crash: boolean }) {
	if (crash) {
		throw new Error("TGF-349: deliberate sandbox render error");
	}
	return (
		<Text c="dimmed" data-testid="sandbox-error-idle">
			No error thrown yet. Use the button above to crash this section.
		</Text>
	);
}

/**
 * Debug-only sandbox for verifying the Sentry pipeline end-to-end (TGF-349):
 * trigger a deliberate render error, then confirm in Sentry that the event
 * arrives with the expected release tag, symbolicated stack frames, and a
 * user context carrying the Clerk user ID only (no email / IP).
 *
 * Intentionally absent from the navbar — reachable only by URL.
 */
export function SandboxErrorPage() {
	const [crash, setCrash] = useState(false);

	const release = import.meta.env.VITE_BUILD_SHA;
	const dsnConfigured = Boolean(import.meta.env.VITE_SENTRY_DSN);

	return (
		<Stack maw={640}>
			<Title order={2}>Sentry error sandbox</Title>
			<Text c="dimmed">
				Throws a deliberate render error so Sentry capture, release tagging, source-map
				symbolication, and PII scrubbing can be verified against a real build.
			</Text>

			<Card withBorder>
				<Stack gap="xs">
					<Group gap="xs">
						<Text fw={500}>Sentry DSN</Text>
						<Badge color={dsnConfigured ? "green" : "gray"} data-testid="sandbox-dsn-badge">
							{dsnConfigured ? "configured" : "not configured"}
						</Badge>
					</Group>
					<Group gap="xs">
						<Text fw={500}>Release</Text>
						<Text ff="monospace" data-testid="sandbox-release">
							{release ?? "(unset — local dev)"}
						</Text>
					</Group>
					<Group gap="xs">
						<Text fw={500}>Environment</Text>
						<Text ff="monospace">{import.meta.env.MODE}</Text>
					</Group>
				</Stack>
			</Card>

			<Group>
				<Button color="red" onClick={() => setCrash(true)} data-testid="sandbox-crash-button">
					Throw render error
				</Button>
				{crash && (
					<Button variant="default" onClick={() => setCrash(false)}>
						Disarm
					</Button>
				)}
			</Group>

			<ErrorBoundary>
				<CrashOnRender crash={crash} />
			</ErrorBoundary>
		</Stack>
	);
}
