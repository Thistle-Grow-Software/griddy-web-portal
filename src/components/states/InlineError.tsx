import { Alert, Button, Stack, Text } from "@mantine/core";
import { IconAlertCircle } from "@tabler/icons-react";
import type { ReactNode } from "react";

export type InlineErrorProps = {
	title?: string;
	message?: ReactNode;
	/** When provided, renders a "Try again" button (e.g. wire to query.refetch). */
	onRetry?: () => void;
};

/**
 * Contained failure surface: a widget or section failed while the rest of the
 * page still works. Always give the user something actionable — never a blank
 * area, never a raw error trace.
 */
export function InlineError({
	title = "Something went wrong",
	message,
	onRetry,
}: InlineErrorProps) {
	return (
		<Alert color="red" icon={<IconAlertCircle size={16} />} title={title}>
			<Stack gap="xs" align="flex-start">
				{message ? <Text size="sm">{message}</Text> : null}
				{onRetry ? (
					<Button size="xs" variant="light" color="red" onClick={onRetry}>
						Try again
					</Button>
				) : null}
			</Stack>
		</Alert>
	);
}
