import { routeTree } from "@/routeTree.gen";
import { ClerkProvider, useAuth } from "@clerk/react";
import { ColorSchemeScript } from "@mantine/core";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { StrictMode } from "react";
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
