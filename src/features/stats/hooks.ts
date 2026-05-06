import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { fetchStatsQuery } from "./api";
import type { StatsQueryParams } from "./types";

export const statsKeys = {
	all: ["stats"] as const,
	query: (params: StatsQueryParams) => ["stats", "query", params] as const,
};

export function useStatsQuery(params: StatsQueryParams, enabled = true) {
	return useQuery({
		queryKey: statsKeys.query(params),
		queryFn: ({ signal }) => fetchStatsQuery(params, signal),
		// Keep the prior result on screen while the next one loads — UX target
		// from the AC: "Good loading state; keep previous results visible".
		placeholderData: keepPreviousData,
		enabled,
	});
}
