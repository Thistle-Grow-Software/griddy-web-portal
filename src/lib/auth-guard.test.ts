import { describe, expect, it } from "vitest";
import { requireAuth } from "./auth-guard";

type AuthLike = { isLoaded: boolean; isSignedIn: boolean | null | undefined };

function callGuard(auth: AuthLike, href = "/games/123") {
	return requireAuth({
		// biome-ignore lint/suspicious/noExplicitAny: shape-only stand-in for Clerk's UseAuthReturn
		context: { auth: auth as any },
		location: { href },
	});
}

describe("requireAuth", () => {
	it("does nothing when the user is signed in", () => {
		expect(() => callGuard({ isLoaded: true, isSignedIn: true })).not.toThrow();
	});

	it("throws a redirect to /sign-in/$ with the original URL preserved when signed out", () => {
		try {
			callGuard({ isLoaded: true, isSignedIn: false }, "/games/123");
			throw new Error("expected requireAuth to throw");
		} catch (thrown) {
			// TanStack Router's `redirect()` throws a Response with `.options` carrying nav props.
			const r = thrown as Response & {
				options?: {
					to?: string;
					params?: Record<string, string>;
					search?: Record<string, unknown>;
				};
			};
			expect(r.options?.to).toBe("/sign-in/$");
			expect(r.options?.params).toEqual({ _splat: "" });
			expect(r.options?.search).toEqual({ redirect_url: "/games/123" });
		}
	});
});
