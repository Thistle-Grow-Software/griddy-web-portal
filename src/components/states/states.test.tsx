import { renderWithProviders, renderWithRouter, screen, userEvent } from "@/test-utils";
import {
	CardSkeleton,
	EmptyState,
	ErrorBoundary,
	InlineError,
	NotFound,
	PageSkeleton,
	TableSkeleton,
} from "./index";

describe("EmptyState", () => {
	it("renders title, description, and icon", () => {
		renderWithProviders(
			<EmptyState
				icon={<span data-testid="empty-icon" />}
				title="No data available yet"
				description="Check back soon."
			/>,
		);
		expect(screen.getByText("No data available yet")).toBeInTheDocument();
		expect(screen.getByText("Check back soon.")).toBeInTheDocument();
		expect(screen.getByTestId("empty-icon")).toBeInTheDocument();
	});

	it("renders an optional CTA that fires the action", async () => {
		const user = userEvent.setup();
		const onClick = vi.fn();
		renderWithProviders(
			<EmptyState
				title="No results match your filters"
				action={{ label: "Clear filters", onClick }}
			/>,
		);
		await user.click(screen.getByRole("button", { name: "Clear filters" }));
		expect(onClick).toHaveBeenCalledOnce();
	});

	it("omits the CTA when no action is provided", () => {
		renderWithProviders(<EmptyState title="No data available yet" />);
		expect(screen.queryByRole("button")).not.toBeInTheDocument();
	});
});

describe("InlineError", () => {
	it("renders a default title and the message", () => {
		renderWithProviders(<InlineError message="The widget exploded." />);
		expect(screen.getByText("Something went wrong")).toBeInTheDocument();
		expect(screen.getByText("The widget exploded.")).toBeInTheDocument();
	});

	it("renders a Try again button wired to onRetry", async () => {
		const user = userEvent.setup();
		const onRetry = vi.fn();
		renderWithProviders(<InlineError title="Couldn't load teams" onRetry={onRetry} />);
		await user.click(screen.getByRole("button", { name: "Try again" }));
		expect(onRetry).toHaveBeenCalledOnce();
	});

	it("omits the Try again button when onRetry is not provided", () => {
		renderWithProviders(<InlineError message="nope" />);
		expect(screen.queryByRole("button", { name: "Try again" })).not.toBeInTheDocument();
	});
});

describe("NotFound", () => {
	it("renders the 404 surface with a home link", async () => {
		renderWithRouter(<NotFound />);
		expect(await screen.findByText("404")).toBeInTheDocument();
		expect(screen.getByText("We couldn't find that page.")).toBeInTheDocument();
		expect(screen.getByRole("link", { name: "Back to home" })).toHaveAttribute("href", "/");
	});

	it("supports custom title and message for unknown IDs", async () => {
		renderWithRouter(<NotFound title="Team not found" message="No team matches that ID." />);
		expect(await screen.findByText("Team not found")).toBeInTheDocument();
		expect(screen.getByText("No team matches that ID.")).toBeInTheDocument();
	});
});

describe("skeletons", () => {
	it("PageSkeleton renders with its test id", () => {
		renderWithProviders(<PageSkeleton />);
		expect(screen.getByTestId("page-skeleton")).toBeInTheDocument();
	});

	it("TableSkeleton renders the requested number of body rows", () => {
		renderWithProviders(<TableSkeleton rows={5} />);
		expect(screen.getByTestId("table-skeleton")).toBeInTheDocument();
		expect(screen.getAllByTestId("table-skeleton-row")).toHaveLength(5);
	});

	it("TableSkeleton honors a custom data-testid (for existing call-sites)", () => {
		renderWithProviders(<TableSkeleton rows={2} data-testid="player-table-skeleton" />);
		expect(screen.getByTestId("player-table-skeleton")).toBeInTheDocument();
		expect(screen.getAllByTestId("player-table-skeleton-row")).toHaveLength(2);
	});

	it("CardSkeleton renders with its test id", () => {
		renderWithProviders(<CardSkeleton />);
		expect(screen.getByTestId("card-skeleton")).toBeInTheDocument();
	});
});

describe("ErrorBoundary", () => {
	// React logs caught render errors loudly; keep test output readable.
	beforeEach(() => {
		vi.spyOn(console, "error").mockImplementation(() => {});
	});
	afterEach(() => {
		vi.restoreAllMocks();
	});

	let shouldThrow = true;
	function MaybeBoom() {
		if (shouldThrow) {
			throw new Error("Deliberate test error");
		}
		return <div>recovered</div>;
	}

	it("catches a deliberate error and renders the actionable fallback", () => {
		shouldThrow = true;
		renderWithProviders(
			<ErrorBoundary>
				<MaybeBoom />
			</ErrorBoundary>,
		);
		expect(screen.getByText("Something went wrong")).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Report this issue" })).toBeInTheDocument();
	});

	it("re-renders children when Try again is clicked", async () => {
		const user = userEvent.setup();
		shouldThrow = true;
		renderWithProviders(
			<ErrorBoundary>
				<MaybeBoom />
			</ErrorBoundary>,
		);
		shouldThrow = false;
		await user.click(screen.getByRole("button", { name: "Try again" }));
		expect(screen.getByText("recovered")).toBeInTheDocument();
	});
});
