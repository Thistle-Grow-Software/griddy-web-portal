import { configureApiClient } from "@/api/client";
import { ErrorFallback } from "@/components/ErrorFallback";
import { initSentry, setSentryUser } from "@/observability/sentry";
import { routeTree } from "@/routeTree.gen";
import { ClerkProvider, useAuth, useClerk } from "@clerk/react";
import { ColorSchemeScript } from "@mantine/core";
import { ErrorBoundary } from "@sentry/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { StrictMode, useEffect } from "react";
import { createRoot } from "react-dom/client";
import "@/index.css";

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
if (!PUBLISHABLE_KEY) {
	throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY (see .env.example).");
}

initSentry({
	dsn: import.meta.env.VITE_SENTRY_DSN,
	environment: import.meta.env.MODE,
	release: import.meta.env.VITE_BUILD_SHA,
	tracesSampleRate: import.meta.env.PROD ? 0.2 : 0,
});

const router = createRouter({
	routeTree,
	defaultPreload: "intent",
	scrollRestoration: true,
	context: {
		auth: undefined as unknown as ReturnType<typeof useAuth>,
	},
});

declare module "@tanstack/react-router" {
	interface Register {
		router: typeof router;
	}
}

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			staleTime: 5 * 60 * 1000,
			gcTime: 10 * 60 * 1000,
			retry: 1,
			refetchOnWindowFocus: false,
		},
	},
});

function ApiClientBootstrap() {
	const clerk = useClerk();

	useEffect(() => {
		configureApiClient({
			getToken: () => clerk.session?.getToken() ?? Promise.resolve(null),
			forceRefreshToken: () =>
				clerk.session?.getToken({ skipCache: true }) ?? Promise.resolve(null),
			signOutAndRedirect: async () => {
				await clerk.signOut();
				router.history.push("/sign-in");
			},
		});
	}, [clerk]);

	return null;
}

function SentryUserBootstrap() {
	const auth = useAuth();

	useEffect(() => {
		if (!auth.isLoaded) return;
		setSentryUser(auth.isSignedIn && auth.userId ? auth.userId : null);
	}, [auth.isLoaded, auth.isSignedIn, auth.userId]);

	return null;
}

function InnerApp() {
	const auth = useAuth();
	// Re-run beforeLoad guards whenever sign-in state flips (e.g. user signs out
	// while inside the app), so currently-mounted protected routes redirect.
	// biome-ignore lint/correctness/useExhaustiveDependencies: auth.isSignedIn is the trigger, not a value used inside the effect.
	useEffect(() => {
		router.invalidate();
	}, [auth.isSignedIn]);

	// Block the router from mounting until Clerk knows the auth state. Otherwise
	// beforeLoad runs against an unloaded auth context, no-ops, and protected
	// routes render before the redirect can fire.
	if (!auth.isLoaded) {
		return null;
	}
	return <RouterProvider router={router} context={{ auth }} />;
}

const rootElement = document.getElementById("root");
if (!rootElement) {
	throw new Error("Root element #root not found in document.");
}

createRoot(rootElement).render(
	<StrictMode>
		<ColorSchemeScript defaultColorScheme={"auto"} />
		<ErrorBoundary fallback={({ resetError }) => <ErrorFallback resetError={resetError} />}>
			<ClerkProvider
				publishableKey={PUBLISHABLE_KEY}
				signInUrl="/sign-in"
				signUpUrl="/sign-up"
				signInFallbackRedirectUrl="/"
				signUpFallbackRedirectUrl="/"
				routerPush={(to) => router.history.push(to)}
				routerReplace={(to) => router.history.replace(to)}
			>
				<QueryClientProvider client={queryClient}>
					<ApiClientBootstrap />
					<SentryUserBootstrap />
					<InnerApp />
					{import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
				</QueryClientProvider>
			</ClerkProvider>
		</ErrorBoundary>
	</StrictMode>,
);
