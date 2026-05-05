// @vitest-environment node
// happy-dom's Response implementation has a known incompatibility with MSW's
// ReadableStream-backed responses ("Invalid state: ReadableStream is locked").
// MSW handler tests don't need the DOM, so run them under Node where the
// native fetch + Response work cleanly.
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { server } from "./server";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

describe("MSW reference handler", () => {
	it("returns the seeded teams payload from the default handler", async () => {
		const response = await fetch(`${API_BASE}/api/teams/`);
		expect(response.ok).toBe(true);

		const body = await response.json();
		expect(body.count).toBe(2);
		expect(body.results.map((t: { id: string }) => t.id)).toEqual(["nfl-sea", "nfl-sf"]);
	});

	it("supports per-test overrides via server.use(...)", async () => {
		server.use(
			http.get(`${API_BASE}/api/teams/`, () => {
				return HttpResponse.json({ count: 0, results: [] });
			}),
		);

		const response = await fetch(`${API_BASE}/api/teams/`);
		const body = await response.json();
		expect(body.count).toBe(0);
		expect(body.results).toEqual([]);
	});

	it("fails noisily on unhandled requests so missing mocks surface as test failures", async () => {
		await expect(fetch(`${API_BASE}/api/unknown-endpoint/`)).rejects.toThrow();
	});
});
