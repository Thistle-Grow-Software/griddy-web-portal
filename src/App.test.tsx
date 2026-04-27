import { App } from "@/App";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

describe("App", () => {
	it("renders the placeholder heading", () => {
		render(<App />);
		expect(screen.getByRole("heading", { name: /griddy portal/i })).toBeInTheDocument();
	});

	it("renders the scaffold-only notice", () => {
		render(<App />);
		expect(screen.getByText(/scaffold-only/i)).toBeInTheDocument();
	});
});
