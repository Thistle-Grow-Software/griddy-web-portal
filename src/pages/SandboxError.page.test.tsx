import { SandboxErrorPage } from "@/pages/SandboxError.page";
import { renderWithProviders, screen, userEvent } from "@/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("SandboxErrorPage", () => {
	// React logs caught render errors loudly; keep test output readable.
	beforeEach(() => {
		vi.spyOn(console, "error").mockImplementation(() => {});
	});
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("renders diagnostics and the idle state without throwing", () => {
		renderWithProviders(<SandboxErrorPage />);
		expect(screen.getByRole("heading", { name: "Sentry error sandbox" })).toBeInTheDocument();
		expect(screen.getByTestId("sandbox-dsn-badge")).toBeInTheDocument();
		expect(screen.getByTestId("sandbox-release")).toBeInTheDocument();
		expect(screen.getByTestId("sandbox-error-idle")).toBeInTheDocument();
	});

	it("throws a render error into the ErrorBoundary when the crash button is clicked", async () => {
		const user = userEvent.setup();
		renderWithProviders(<SandboxErrorPage />);

		await user.click(screen.getByTestId("sandbox-crash-button"));

		expect(screen.getByText("Something went wrong")).toBeInTheDocument();
		expect(screen.queryByTestId("sandbox-error-idle")).not.toBeInTheDocument();
		// The crash is contained to the sandbox section — the page chrome survives.
		expect(screen.getByRole("heading", { name: "Sentry error sandbox" })).toBeInTheDocument();
	});

	it("recovers via Disarm + Try again", async () => {
		const user = userEvent.setup();
		renderWithProviders(<SandboxErrorPage />);

		await user.click(screen.getByTestId("sandbox-crash-button"));
		expect(screen.getByText("Something went wrong")).toBeInTheDocument();

		await user.click(screen.getByRole("button", { name: "Disarm" }));
		await user.click(screen.getByRole("button", { name: "Try again" }));

		expect(screen.getByTestId("sandbox-error-idle")).toBeInTheDocument();
	});
});
