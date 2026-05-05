import { MantineProvider } from "@mantine/core";
import { ModalsProvider } from "@mantine/modals";
import { Notifications } from "@mantine/notifications";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
	Outlet,
	RouterProvider,
	createMemoryHistory,
	createRootRoute,
	createRoute,
	createRouter,
} from "@tanstack/react-router";
import { type RenderOptions, render } from "@testing-library/react";
import type { PropsWithChildren, ReactElement } from "react";

export type TestProvidersOptions = {
	/**
	 * Inject a pre-built QueryClient (e.g. to seed cache or assert calls).
	 * Defaults to a fresh client with retries disabled — failing queries fail
	 * fast in tests instead of waiting on the default backoff.
	 */
	queryClient?: QueryClient;
};

export function createTestQueryClient(): QueryClient {
	return new QueryClient({
		defaultOptions: {
			queries: { retry: false, gcTime: 0, staleTime: 0 },
			mutations: { retry: false },
		},
	});
}

export function TestProviders({ children, queryClient }: PropsWithChildren<TestProvidersOptions>) {
	const client = queryClient ?? createTestQueryClient();
	return (
		<QueryClientProvider client={client}>
			<MantineProvider>
				<Notifications />
				<ModalsProvider>{children}</ModalsProvider>
			</MantineProvider>
		</QueryClientProvider>
	);
}

/**
 * Drop-in replacement for Testing Library's `render` that wraps the tree in
 * the same provider stack used by the app (Mantine + TanStack Query). For
 * tests that need Clerk hooks, mock `@clerk/react` per-file with `vi.mock`.
 *
 * Components that render `<Link>` from `@tanstack/react-router` need a router
 * context. Use `renderWithRouter` for those.
 */
export function renderWithProviders(
	ui: ReactElement,
	{ queryClient, ...options }: TestProvidersOptions & Omit<RenderOptions, "wrapper"> = {},
) {
	return render(ui, {
		wrapper: ({ children }) => <TestProviders queryClient={queryClient}>{children}</TestProviders>,
		...options,
	});
}

export type RenderWithRouterOptions = TestProvidersOptions &
	Omit<RenderOptions, "wrapper"> & {
		/** Initial pathname for the memory history. Defaults to "/". */
		initialPath?: string;
	};

/**
 * Renders `ui` inside a TanStack Router memory router. The router uses a
 * permissive root route that simply renders the `ui` so component tests can
 * exercise `<Link>` and `useNavigate` without needing the real app routeTree.
 *
 * Link `href` assertions work because TanStack Router resolves links via the
 * router instance, not the DOM.
 */
export function renderWithRouter(ui: ReactElement, options: RenderWithRouterOptions = {}) {
	const { initialPath = "/", queryClient, ...renderOptions } = options;

	const rootRoute = createRootRoute({ component: () => <Outlet /> });
	const indexRoute = createRoute({
		getParentRoute: () => rootRoute,
		path: "/",
		component: () => ui,
	});
	// Catch-all so <Link to="/anything"> resolves cleanly inside tests.
	const catchAllRoute = createRoute({
		getParentRoute: () => rootRoute,
		path: "$",
		component: () => ui,
	});
	const router = createRouter({
		routeTree: rootRoute.addChildren([indexRoute, catchAllRoute]),
		history: createMemoryHistory({ initialEntries: [initialPath] }),
	});

	return render(<RouterProvider router={router} />, {
		wrapper: ({ children }) => <TestProviders queryClient={queryClient}>{children}</TestProviders>,
		...renderOptions,
	});
}

export * from "@testing-library/react";
export { default as userEvent } from "@testing-library/user-event";
