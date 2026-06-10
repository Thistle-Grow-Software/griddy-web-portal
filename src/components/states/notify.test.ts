import { notifications } from "@mantine/notifications";
import { notify } from "./notify";

vi.mock("@mantine/notifications", () => ({
	notifications: { show: vi.fn(() => "notification-id") },
}));

const showMock = vi.mocked(notifications.show);

describe("notify", () => {
	beforeEach(() => {
		showMock.mockClear();
	});

	it("success is transient: green, auto-dismisses after 3s", () => {
		const id = notify.success("Saved");
		expect(id).toBe("notification-id");
		expect(showMock).toHaveBeenCalledWith(
			expect.objectContaining({ message: "Saved", color: "green", autoClose: 3000 }),
		);
	});

	it("error is sticky: red, never auto-dismisses, dismissable", () => {
		notify.error("Failed");
		expect(showMock).toHaveBeenCalledWith(
			expect.objectContaining({
				message: "Failed",
				color: "red",
				autoClose: false,
				withCloseButton: true,
			}),
		);
	});

	it("info is transient: blue, auto-dismisses after 5s", () => {
		notify.info("FYI");
		expect(showMock).toHaveBeenCalledWith(
			expect.objectContaining({ message: "FYI", color: "blue", autoClose: 5000 }),
		);
	});

	it("passes extra options (e.g. title) through", () => {
		notify.error("Failed", { title: "Upload error" });
		expect(showMock).toHaveBeenCalledWith(expect.objectContaining({ title: "Upload error" }));
	});
});
