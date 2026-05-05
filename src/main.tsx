import { routeTree } from "@/routeTree.gen";
import { ClerkProvider, useAuth } from "@clerk/react";
import { ColorSchemeScript } from "@mantine/core";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { StrictMode, useEffect } from "react";
import { createRoot } from "react-dom/client";
import "@/index.css";

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
if (!PUBLISHABLE_KEY) {
	throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY (see .env.example).");
}

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
		<ClerkProvider
			publishableKey={PUBLISHABLE_KEY}
			signInUrl="/sign-in"
			signUpUrl="/sign-up"
			signInFallbackRedirectUrl="/"
			signUpFallbackRedirectUrl="/"
			routerPush={(to) => router.history.push(to)}
			routerReplace={(to) => router.history.replace(to)}
		>
			<InnerApp />
		</ClerkProvider>
	</StrictMode>,
);
