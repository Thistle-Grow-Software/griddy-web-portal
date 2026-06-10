import { type NotificationData, notifications } from "@mantine/notifications";

type NotifyMessage = NotificationData["message"];
type NotifyOptions = Omit<NotificationData, "message" | "color" | "autoClose">;

/**
 * App-wide toast conventions:
 * - success: transient, auto-dismisses after 3s
 * - error: sticky, stays until the user dismisses it
 * - info: transient, auto-dismisses after 5s
 *
 * Callers pass the message (and optionally a title) — never timing or color,
 * so the conventions stay consistent everywhere. Returns the notification id.
 */
export const notify = {
	success(message: NotifyMessage, options?: NotifyOptions): string {
		return notifications.show({
			color: "green",
			autoClose: 3000,
			withCloseButton: true,
			message,
			...options,
		});
	},
	error(message: NotifyMessage, options?: NotifyOptions): string {
		return notifications.show({
			color: "red",
			autoClose: false,
			withCloseButton: true,
			message,
			...options,
		});
	},
	info(message: NotifyMessage, options?: NotifyOptions): string {
		return notifications.show({
			color: "blue",
			autoClose: 5000,
			withCloseButton: true,
			message,
			...options,
		});
	},
};
