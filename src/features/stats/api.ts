import type { FilterValues, StatsQueryParams, StatsQueryResult } from "./types";

const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000").replace(/\/+$/, "");

/**
 * Encodes structured filter values into query-string params the MSW handler
 * (and eventually the DRF endpoint) understands. Each filter kind maps to a
 * predictable parameter shape so the round-trip is auditable in the URL bar.
 */
export function encodeFilters(filters: FilterValues): URLSearchParams {
	const out = new URLSearchParams();
	for (const [id, value] of Object.entries(filters)) {
		switch (value.kind) {
			case "select":
				if (value.value) out.set(id, value.value);
				break;
			case "multiselect":
				for (const v of value.values) out.append(id, v);
				break;
			case "text":
				if (value.value.trim()) out.set(id, value.value.trim());
				break;
			case "boolean":
				if (value.value) out.set(id, "true");
				break;
			case "number-range":
				if (value.min !== null) out.set(`${id}_min`, String(value.min));
				if (value.max !== null) out.set(`${id}_max`, String(value.max));
				break;
		}
	}
	return out;
}

function buildStatsQueryPath(params: StatsQueryParams): string {
	const search = encodeFilters(params.filters);
	search.set("entity", params.entity);
	search.set("sort", params.sort.id);
	search.set("dir", params.sort.direction);
	if (params.page !== undefined) search.set("page", String(params.page));
	if (params.pageSize !== undefined) search.set("page_size", String(params.pageSize));
	return `/api/stats/query/?${search.toString()}`;
}

async function getJson<T>(path: string, signal?: AbortSignal): Promise<T> {
	const response = await fetch(`${API_BASE}${path}`, { signal });
	if (!response.ok) {
		throw new Error(`Request failed (${response.status}): ${path}`);
	}
	return (await response.json()) as T;
}

export function fetchStatsQuery(
	params: StatsQueryParams,
	signal?: AbortSignal,
): Promise<StatsQueryResult> {
	return getJson<StatsQueryResult>(buildStatsQueryPath(params), signal);
}

export const _internal = { buildStatsQueryPath };
