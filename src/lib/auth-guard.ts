import type { useAuth } from "@clerk/react";
import { redirect } from "@tanstack/react-router";

type AuthContext = ReturnType<typeof useAuth>;

export function requireAuth({
	context,
	location,
}: {
	context: { auth: AuthContext };
	location: { href: string };
}) {
	// main.tsx blocks RouterProvider until Clerk has loaded, so by the time any
	// beforeLoad runs, isLoaded is guaranteed true.
	if (!context.auth.isSignedIn) {
		throw redirect({
			to: "/sign-in/$",
			params: { _splat: "" },
			search: { redirect_url: location.href },
		});
	}
}
