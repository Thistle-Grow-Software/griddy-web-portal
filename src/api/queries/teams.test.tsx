import type { PaginatedTeamListList, TeamDetail, TeamWrite } from "@/api/generated";
import { client } from "@/api/generated/client.gen";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { PropsWithChildren } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { teamsKeys, useTeamCreate, useTeamDetail, useTeamUpdate, useTeamsList } from "./teams";

// Stub fetch at the generated-client boundary: the hooks go through the real
// hey-api request pipeline (URL building, query serialization, JSON parsing)
// and only the network call itself is faked. No MSW — see
// src/features/teams/hooks.test.tsx for the happy-dom rationale.
const fetchStub = vi.fn<typeof fetch>();

function jsonResponse(body: unknown, status = 200): Response {
	return new Response(JSON.stringify(body), {
		status,
		headers: { "Content-Type": "application/json" },
	});
}

function makeClientAndWrapper() {
	const queryClient = new QueryClient({
		defaultOptions: { queries: { retry: false, gcTime: 0 } },
	});
	const wrapper = ({ children }: PropsWithChildren) => (
		<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
	);
	return { queryClient, wrapper };
}

const TEAM_LIST_PAGE: PaginatedTeamListList = {
	next: null,
	previous: null,
	results: [
		{
			id: 7,
			name: "Kansas City Chiefs",
			short_name: "Chiefs",
			city: "Kansas City",
			state: "MO",
			franchise: 3,
			primary_color: "#E31837",
			secondary_color: "#FFB81C",
		},
	],
};

const TEAM_DETAIL: TeamDetail = {
	id: 7,
	franchise: 3,
	name: "Kansas City Chiefs",
	short_name: "Chiefs",
	city: "Kansas City",
	state: "MO",
	affiliations: [],
	venue_occupancies: [],
};

beforeEach(() => {
	fetchStub.mockReset();
	client.setConfig({ baseUrl: "http://localhost:8000", fetch: fetchStub });
});

describe("teamsKeys", () => {
	it("follows the [resource, scope, params] convention", () => {
		expect(teamsKeys.all).toEqual(["teams"]);
		expect(teamsKeys.lists()).toEqual(["teams", "list"]);
		expect(teamsKeys.list({ search: "chiefs" })).toEqual(["teams", "list", { search: "chiefs" }]);
		expect(teamsKeys.details()).toEqual(["teams", "detail"]);
		expect(teamsKeys.detail(7)).toEqual(["teams", "detail", 7]);
	});
});

describe("useTeamsList", () => {
	it("returns the paginated page typed from the generated client", async () => {
		fetchStub.mockResolvedValue(jsonResponse(TEAM_LIST_PAGE));
		const { wrapper } = makeClientAndWrapper();

		const { result } = renderHook(() => useTeamsList(), { wrapper });

		await waitFor(() => expect(result.current.isSuccess).toBe(true));
		// No casting anywhere: `data` is PaginatedTeamListList by inference.
		expect(result.current.data?.results[0].name).toBe("Kansas City Chiefs");

		const request = fetchStub.mock.calls[0][0] as Request;
		expect(request.method).toBe("GET");
		expect(request.url).toBe("http://localhost:8000/api/v1/teams/");
	});

	it("serializes filters into the query string and the query key", async () => {
		fetchStub.mockResolvedValue(jsonResponse(TEAM_LIST_PAGE));
		const { queryClient, wrapper } = makeClientAndWrapper();

		const { result } = renderHook(() => useTeamsList({ search: "chiefs", state: "MO" }), {
			wrapper,
		});

		await waitFor(() => expect(result.current.isSuccess).toBe(true));
		const request = fetchStub.mock.calls[0][0] as Request;
		const url = new URL(request.url);
		expect(url.pathname).toBe("/api/v1/teams/");
		expect(url.searchParams.get("search")).toBe("chiefs");
		expect(url.searchParams.get("state")).toBe("MO");
		expect(queryClient.getQueryData(teamsKeys.list({ search: "chiefs", state: "MO" }))).toEqual(
			TEAM_LIST_PAGE,
		);
	});

	it("surfaces HTTP errors through the query error state", async () => {
		fetchStub.mockResolvedValue(jsonResponse({ detail: "nope" }, 500));
		const { wrapper } = makeClientAndWrapper();

		const { result } = renderHook(() => useTeamsList(), { wrapper });

		await waitFor(() => expect(result.current.isError).toBe(true));
	});
});

describe("useTeamDetail", () => {
	it("fetches the team by id and caches under the detail key", async () => {
		fetchStub.mockResolvedValue(jsonResponse(TEAM_DETAIL));
		const { queryClient, wrapper } = makeClientAndWrapper();

		const { result } = renderHook(() => useTeamDetail(7), { wrapper });

		await waitFor(() => expect(result.current.isSuccess).toBe(true));
		expect(result.current.data?.affiliations).toEqual([]);
		const request = fetchStub.mock.calls[0][0] as Request;
		expect(request.url).toBe("http://localhost:8000/api/v1/teams/7/");
		expect(queryClient.getQueryData(teamsKeys.detail(7))).toEqual(TEAM_DETAIL);
	});
});

describe("useTeamCreate", () => {
	it("POSTs the body and invalidates team lists on success", async () => {
		const body: TeamWrite = { name: "Portland Breakers", franchise: 9 };
		fetchStub.mockResolvedValue(jsonResponse(body, 201));
		const { queryClient, wrapper } = makeClientAndWrapper();
		const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

		const { result } = renderHook(() => useTeamCreate(), { wrapper });
		await result.current.mutateAsync(body);

		const request = fetchStub.mock.calls[0][0] as Request;
		expect(request.method).toBe("POST");
		expect(request.url).toBe("http://localhost:8000/api/v1/teams/");
		expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: teamsKeys.lists() });
	});
});

describe("useTeamUpdate", () => {
	it("PATCHes the team and invalidates its lists and detail on success", async () => {
		fetchStub.mockResolvedValue(jsonResponse({ name: "Renamed" }));
		const { queryClient, wrapper } = makeClientAndWrapper();
		const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

		const { result } = renderHook(() => useTeamUpdate(), { wrapper });
		await result.current.mutateAsync({ id: 7, changes: { name: "Renamed" } });

		const request = fetchStub.mock.calls[0][0] as Request;
		expect(request.method).toBe("PATCH");
		expect(request.url).toBe("http://localhost:8000/api/v1/teams/7/");
		expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: teamsKeys.lists() });
		expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: teamsKeys.detail(7) });
	});
});
