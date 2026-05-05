import { MantineProvider } from "@mantine/core";
import { ModalsProvider } from "@mantine/modals";
import { Notifications } from "@mantine/notifications";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
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
 * For tests that need router context, render inside a TanStack Router
 * memory router.
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

export * from "@testing-library/react";
export { default as userEvent } from "@testing-library/user-event";
