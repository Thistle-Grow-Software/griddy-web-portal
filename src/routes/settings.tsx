import { requireAuth } from "@/lib/auth-guard";
import { UserProfile } from "@clerk/react";
import { Center } from "@mantine/core";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/settings")({
	beforeLoad: requireAuth,
	component: SettingsPage,
});

function SettingsPage() {
	return (
		<Center mt="xl">
			<UserProfile routing="path" path="/settings" />
		</Center>
	);
}
