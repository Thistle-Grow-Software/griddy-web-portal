import type {
	CareerSeason,
	GameLogEntry,
	PlayerDetail,
	PlayerListParams,
	PlayerListResponse,
} from "./types";

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

function buildPlayersListPath(params: PlayerListParams): string {
	const search = new URLSearchParams();
	if (params.q) search.set("q", params.q);
	if (params.league) search.set("league", params.league);
	if (params.position) search.set("position", params.position);
	if (params.teamIds && params.teamIds.length > 0) {
		// Repeat the param for each team — matches DRF's MultipleChoiceFilter.
		for (const id of params.teamIds) search.append("team", id);
	}
	if (params.active !== undefined) search.set("active", String(params.active));
	if (params.page !== undefined) search.set("page", String(params.page));
	if (params.pageSize !== undefined) search.set("page_size", String(params.pageSize));
	const query = search.toString();
	return `/api/players/${query ? `?${query}` : ""}`;
}

export function fetchPlayersList(
	params: PlayerListParams,
	signal?: AbortSignal,
): Promise<PlayerListResponse> {
	return getJson<PlayerListResponse>(buildPlayersListPath(params), signal);
}

export function fetchPlayerDetail(playerId: string, signal?: AbortSignal): Promise<PlayerDetail> {
	return getJson<PlayerDetail>(`/api/players/${encodeURIComponent(playerId)}/`, signal);
}

export function fetchPlayerCareer(playerId: string, signal?: AbortSignal): Promise<CareerSeason[]> {
	return getJson<CareerSeason[]>(`/api/players/${encodeURIComponent(playerId)}/career/`, signal);
}

export function fetchPlayerGameLog(
	playerId: string,
	season: number,
	signal?: AbortSignal,
): Promise<GameLogEntry[]> {
	return getJson<GameLogEntry[]>(
		`/api/players/${encodeURIComponent(playerId)}/game-log/?season=${season}`,
		signal,
	);
}

export const _internal = { buildPlayersListPath };
