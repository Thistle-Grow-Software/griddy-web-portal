import { describe, expect, it, vi } from "vitest";
import {
	type ApiClientDeps,
	createAuthRequestInterceptor,
	createUnauthorizedRetryInterceptor,
} from "./client";

function makeRequest(url = "https://api.example.com/teams") {
	return new Request(url, { method: "GET" });
}

function makeResponse(status: number, body = "") {
	return new Response(body, { status });
}

describe("createAuthRequestInterceptor", () => {
	it("attaches a Bearer header when getToken returns a token", async () => {
		const interceptor = createAuthRequestInterceptor({
			getToken: () => Promise.resolve("token-abc"),
		});
		const out = await interceptor(makeRequest());
		expect(out.headers.get("Authorization")).toBe("Bearer token-abc");
	});

	it("does not set the header when getToken returns null", async () => {
		const interceptor = createAuthRequestInterceptor({
			getToken: () => Promise.resolve(null),
		});
		const out = await interceptor(makeRequest());
		expect(out.headers.get("Authorization")).toBeNull();
	});
});

describe("createUnauthorizedRetryInterceptor", () => {
	function makeDeps(overrides: Partial<ApiClientDeps> = {}): ApiClientDeps {
		return {
			getToken: vi.fn().mockResolvedValue("stale-token"),
			forceRefreshToken: vi.fn().mockResolvedValue("fresh-token"),
			signOutAndRedirect: vi.fn().mockResolvedValue(undefined),
			...overrides,
		};
	}

	it("passes non-401 responses through unchanged", async () => {
		const deps = makeDeps();
		const fetchSpy = vi.fn();
		const interceptor = createUnauthorizedRetryInterceptor(deps, fetchSpy);
		const original = makeResponse(200, "ok");

		const out = await interceptor(original, makeRequest());

		expect(out).toBe(original);
		expect(deps.forceRefreshToken).not.toHaveBeenCalled();
		expect(fetchSpy).not.toHaveBeenCalled();
		expect(deps.signOutAndRedirect).not.toHaveBeenCalled();
	});

	it("on 401: force-refreshes the token and retries the request once", async () => {
		const deps = makeDeps();
		const retryResponse = makeResponse(200, "retried-ok");
		const fetchSpy = vi.fn().mockResolvedValue(retryResponse);
		const interceptor = createUnauthorizedRetryInterceptor(deps, fetchSpy);

		const out = await interceptor(makeResponse(401), makeRequest());

		expect(deps.forceRefreshToken).toHaveBeenCalledOnce();
		expect(fetchSpy).toHaveBeenCalledOnce();
		const retried = fetchSpy.mock.calls[0][0] as Request;
		expect(retried.headers.get("Authorization")).toBe("Bearer fresh-token");
		expect(out).toBe(retryResponse);
		expect(deps.signOutAndRedirect).not.toHaveBeenCalled();
	});

	it("on 401 + refresh failure: signs out and returns the original 401", async () => {
		const deps = makeDeps({
			forceRefreshToken: vi.fn().mockResolvedValue(null),
		});
		const fetchSpy = vi.fn();
		const interceptor = createUnauthorizedRetryInterceptor(deps, fetchSpy);
		const original = makeResponse(401);

		const out = await interceptor(original, makeRequest());

		expect(deps.signOutAndRedirect).toHaveBeenCalledOnce();
		expect(fetchSpy).not.toHaveBeenCalled();
		expect(out).toBe(original);
	});

	it("on 401 + retry-also-401: signs out and returns the retry response", async () => {
		const deps = makeDeps();
		const secondFailure = makeResponse(401, "still-unauthorized");
		const fetchSpy = vi.fn().mockResolvedValue(secondFailure);
		const interceptor = createUnauthorizedRetryInterceptor(deps, fetchSpy);

		const out = await interceptor(makeResponse(401), makeRequest());

		expect(fetchSpy).toHaveBeenCalledOnce();
		expect(deps.signOutAndRedirect).toHaveBeenCalledOnce();
		expect(out).toBe(secondFailure);
	});
});
