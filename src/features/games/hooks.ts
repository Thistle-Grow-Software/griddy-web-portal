import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { fetchGameBoxScore, fetchGameDetail, fetchGamePlayByPlay, fetchGamesList } from "./api";
import type { GameListParams } from "./types";

export const gamesKeys = {
	all: ["games"] as const,
	list: (params: GameListParams) => ["games", "list", params] as const,
	detail: (id: string) => ["games", "detail", id] as const,
	boxScore: (id: string) => ["games", "boxScore", id] as const,
	playByPlay: (id: string) => ["games", "playByPlay", id] as const,
};

export function useGamesList(params: GameListParams) {
	return useQuery({
		queryKey: gamesKeys.list(params),
		queryFn: ({ signal }) => fetchGamesList(params, signal),
		placeholderData: keepPreviousData,
	});
}

export function useGameDetail(gameId: string) {
	return useQuery({
		queryKey: gamesKeys.detail(gameId),
		queryFn: ({ signal }) => fetchGameDetail(gameId, signal),
		enabled: Boolean(gameId),
		retry: (failureCount, error) => {
			if ((error as { status?: number }).status === 404) return false;
			return failureCount < 2;
		},
	});
}

export function useGameBoxScore(gameId: string, enabled = true) {
	return useQuery({
		queryKey: gamesKeys.boxScore(gameId),
		queryFn: ({ signal }) => fetchGameBoxScore(gameId, signal),
		enabled: Boolean(gameId) && enabled,
	});
}

export function useGamePlayByPlay(gameId: string, enabled = true) {
	return useQuery({
		queryKey: gamesKeys.playByPlay(gameId),
		queryFn: ({ signal }) => fetchGamePlayByPlay(gameId, signal),
		enabled: Boolean(gameId) && enabled,
	});
}
