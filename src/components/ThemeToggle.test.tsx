import { ThemeToggle } from "@/components/ThemeToggle";
import { renderWithProviders, screen, userEvent } from "@/test-utils";
import { describe, expect, it } from "vitest";

describe("<ThemeToggle />", () => {
	it("renders an accessible toggle button", () => {
		renderWithProviders(<ThemeToggle />);

		expect(screen.getByRole("button", { name: /toggle color scheme/i })).toBeInTheDocument();
	});

	it("is clickable without throwing", async () => {
		const user = userEvent.setup();
		renderWithProviders(<ThemeToggle />);

		await user.click(screen.getByRole("button", { name: /toggle color scheme/i }));

		expect(screen.getByRole("button", { name: /toggle color scheme/i })).toBeInTheDocument();
	});
});
