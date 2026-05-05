import type {
	RosterPlayer,
	ScheduleGame,
	SeasonStats,
	TeamDetail,
	TeamListParams,
	TeamListResponse,
} from "./types";

// Base URL for the Griddy API. In tests + dev MSW intercepts at this origin;
// in production the env var points at the deployed DRF backend. Trailing
// slash is stripped so callers can compose with `/api/teams/...` cleanly.
const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000").replace(/\/+$/, "");

async function getJson<T>(path: string, signal?: AbortSignal): Promise<T> {
	const response = await fetch(`${API_BASE}${path}`, { signal });
	if (response.status === 404) {
		const error = new Error(`Not found: ${path}`) as Error & { status?: number };
		error.status = 404;
		throw error;
	}
	if (!response.ok) {
		throw new Error(`Request failed (${response.status}): ${path}`);
	}
	return (await response.json()) as T;
}

function buildTeamsListPath(params: TeamListParams): string {
	const search = new URLSearchParams();
	if (params.league) search.set("league", params.league);
	if (params.season !== undefined) search.set("season", String(params.season));
	if (params.q) search.set("q", params.q);
	if (params.page !== undefined) search.set("page", String(params.page));
	if (params.pageSize !== undefined) search.set("page_size", String(params.pageSize));
	const query = search.toString();
	return `/api/teams/${query ? `?${query}` : ""}`;
}

export function fetchTeamsList(
	params: TeamListParams,
	signal?: AbortSignal,
): Promise<TeamListResponse> {
	return getJson<TeamListResponse>(buildTeamsListPath(params), signal);
}

export function fetchTeamDetail(teamId: string, signal?: AbortSignal): Promise<TeamDetail> {
	return getJson<TeamDetail>(`/api/teams/${encodeURIComponent(teamId)}/`, signal);
}

export function fetchTeamRoster(teamId: string, signal?: AbortSignal): Promise<RosterPlayer[]> {
	return getJson<RosterPlayer[]>(`/api/teams/${encodeURIComponent(teamId)}/roster/`, signal);
}

export function fetchTeamSchedule(teamId: string, signal?: AbortSignal): Promise<ScheduleGame[]> {
	return getJson<ScheduleGame[]>(`/api/teams/${encodeURIComponent(teamId)}/schedule/`, signal);
}

export function fetchTeamStats(teamId: string, signal?: AbortSignal): Promise<SeasonStats> {
	return getJson<SeasonStats>(`/api/teams/${encodeURIComponent(teamId)}/stats/`, signal);
}

// Exposed for tests that want to assert on the constructed query string.
export const _internal = { buildTeamsListPath };
