import type { BoxScore, GameDetail, GameListParams, GameListResponse, PlayByPlay } from "./types";

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

function buildGamesListPath(params: GameListParams): string {
	const search = new URLSearchParams();
	if (params.league) search.set("league", params.league);
	if (params.season !== undefined) search.set("season", String(params.season));
	if (params.week !== undefined) search.set("week", String(params.week));
	if (params.status) search.set("status", params.status);
	if (params.teamIds && params.teamIds.length > 0) {
		// Repeat the param for each team — matches DRF's MultipleChoiceFilter.
		for (const id of params.teamIds) search.append("team", id);
	}
	if (params.page !== undefined) search.set("page", String(params.page));
	if (params.pageSize !== undefined) search.set("page_size", String(params.pageSize));
	const query = search.toString();
	return `/api/games/${query ? `?${query}` : ""}`;
}

export function fetchGamesList(
	params: GameListParams,
	signal?: AbortSignal,
): Promise<GameListResponse> {
	return getJson<GameListResponse>(buildGamesListPath(params), signal);
}

export function fetchGameDetail(gameId: string, signal?: AbortSignal): Promise<GameDetail> {
	return getJson<GameDetail>(`/api/games/${encodeURIComponent(gameId)}/`, signal);
}

export function fetchGameBoxScore(gameId: string, signal?: AbortSignal): Promise<BoxScore> {
	return getJson<BoxScore>(`/api/games/${encodeURIComponent(gameId)}/box-score/`, signal);
}

export function fetchGamePlayByPlay(gameId: string, signal?: AbortSignal): Promise<PlayByPlay> {
	return getJson<PlayByPlay>(`/api/games/${encodeURIComponent(gameId)}/play-by-play/`, signal);
}

export const _internal = { buildGamesListPath };
