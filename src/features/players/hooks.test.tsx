import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { PropsWithChildren } from "react";
import { describe, expect, it, vi } from "vitest";

// Mock api so the hook tests stay in happy-dom without hitting the
// MSW + ReadableStream interop bug.
vi.mock("./api", () => ({
	fetchPlayersList: vi.fn(),
	fetchPlayerDetail: vi.fn(),
	fetchPlayerCareer: vi.fn(),
	fetchPlayerGameLog: vi.fn(),
}));

import * as api from "./api";
import { usePlayerDetail, usePlayersList } from "./hooks";

function makeWrapper() {
	const client = new QueryClient({
		defaultOptions: { queries: { retry: false, gcTime: 0 } },
	});
	return ({ children }: PropsWithChildren) => (
		<QueryClientProvider client={client}>{children}</QueryClientProvider>
	);
}

describe("players query hooks", () => {
	it("usePlayersList resolves and exposes the fetched data", async () => {
		vi.mocked(api.fetchPlayersList).mockResolvedValue({
			count: 0,
			page: 1,
			pageSize: 50,
			results: [],
		});

		const { result } = renderHook(() => usePlayersList({ league: "NFL" }), {
			wrapper: makeWrapper(),
		});

		await waitFor(() => expect(result.current.isSuccess).toBe(true));
		expect(api.fetchPlayersList).toHaveBeenCalledWith({ league: "NFL" }, expect.any(AbortSignal));
	});

	it("usePlayerDetail surfaces 404 without retrying", async () => {
		const error = Object.assign(new Error("nope"), { status: 404 });
		vi.mocked(api.fetchPlayerDetail).mockRejectedValue(error);

		const { result } = renderHook(() => usePlayerDetail("nope"), {
			wrapper: makeWrapper(),
		});

		await waitFor(() => expect(result.current.isError).toBe(true));
		expect((result.current.error as { status?: number }).status).toBe(404);
		expect(api.fetchPlayerDetail).toHaveBeenCalledTimes(1);
	});
});
