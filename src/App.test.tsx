import { App } from "@/App";
import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

describe("App", () => {
	const originalPathname = window.location.pathname;

	afterEach(() => {
		window.history.replaceState({}, "", originalPathname);
	});

	it("renders the portal heading", () => {
		render(<App />);
		expect(screen.getByRole("heading", { name: /griddy web portal/i })).toBeInTheDocument();
	});

	it("renders the placeholder body on the default route", () => {
		render(<App />);
		expect(screen.getByText(/hello world/i)).toBeInTheDocument();
	});

	describe("/theme-preview route", () => {
		beforeEach(() => {
			window.history.replaceState({}, "", "/theme-preview");
		});

		it("renders the theme preview page", () => {
			render(<App />);
			expect(screen.getByRole("heading", { name: /theme preview/i, level: 1 })).toBeInTheDocument();
			expect(screen.getByRole("heading", { name: /color swatches/i })).toBeInTheDocument();
			expect(screen.getByRole("heading", { name: /form controls/i })).toBeInTheDocument();
		});
	});
});
