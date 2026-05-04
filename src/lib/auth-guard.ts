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
	if (context.auth.isLoaded && !context.auth.isSignedIn) {
		throw redirect({
			to: "/sign-in/$",
			params: { _splat: "" },
			search: { redirect_url: location.href },
		});
	}
}
