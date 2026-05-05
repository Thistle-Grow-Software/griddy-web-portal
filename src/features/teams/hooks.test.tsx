import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { PropsWithChildren } from "react";
import { describe, expect, it, vi } from "vitest";

// Mock the underlying fetch helpers so the hook tests don't go through
// happy-dom's fetch + MSW (which has a known ReadableStream-lock bug). We're
// testing react-query wiring here, not the network layer — that's covered by
// `api.test.ts` running under the Node environment.
vi.mock("./api", () => ({
	fetchTeamsList: vi.fn(),
	fetchTeamDetail: vi.fn(),
	fetchTeamRoster: vi.fn(),
	fetchTeamSchedule: vi.fn(),
	fetchTeamStats: vi.fn(),
}));

import * as api from "./api";
import { useTeamDetail, useTeamRoster, useTeamsList } from "./hooks";

function makeWrapper() {
	const client = new QueryClient({
		defaultOptions: { queries: { retry: false, gcTime: 0 } },
	});
	return ({ children }: PropsWithChildren) => (
		<QueryClientProvider client={client}>{children}</QueryClientProvider>
	);
}

describe("teams query hooks", () => {
	it("useTeamsList resolves and exposes the fetched data", async () => {
		const payload = {
			count: 1,
			page: 1,
			pageSize: 20,
			results: [
				{
					id: "nfl-kc",
					name: "Chiefs",
					location: "Kansas City",
					logoUrl: null,
					league: "NFL" as const,
					currentSeason: 2025,
					record: { wins: 11, losses: 3, ties: 0 },
				},
			],
			availableSeasons: { NFL: [2025], NCAA: [2025], UFL: [2025], CFL: [2025] },
		};
		vi.mocked(api.fetchTeamsList).mockResolvedValue(payload);

		const { result } = renderHook(() => useTeamsList({ league: "NFL" }), {
			wrapper: makeWrapper(),
		});

		await waitFor(() => expect(result.current.isSuccess).toBe(true));
		expect(result.current.data?.count).toBe(1);
		expect(api.fetchTeamsList).toHaveBeenCalledWith({ league: "NFL" }, expect.any(AbortSignal));
	});

	it("useTeamDetail surfaces 404 without retrying", async () => {
		const error = Object.assign(new Error("not found"), { status: 404 });
		vi.mocked(api.fetchTeamDetail).mockRejectedValue(error);

		const { result } = renderHook(() => useTeamDetail("nope"), {
			wrapper: makeWrapper(),
		});

		await waitFor(() => expect(result.current.isError).toBe(true));
		expect((result.current.error as { status?: number }).status).toBe(404);
		// Retry policy filters 404 → exactly one call, never retried.
		expect(api.fetchTeamDetail).toHaveBeenCalledTimes(1);
	});

	it("useTeamRoster only fires when enabled", () => {
		const { result } = renderHook(() => useTeamRoster("nfl-kc", false), {
			wrapper: makeWrapper(),
		});

		expect(result.current.fetchStatus).toBe("idle");
		expect(result.current.data).toBeUndefined();
		expect(api.fetchTeamRoster).not.toHaveBeenCalled();
	});
});
