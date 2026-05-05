import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { fetchPlayerCareer, fetchPlayerDetail, fetchPlayerGameLog, fetchPlayersList } from "./api";
import type { PlayerListParams } from "./types";

export const playersKeys = {
	all: ["players"] as const,
	list: (params: PlayerListParams) => ["players", "list", params] as const,
	detail: (id: string) => ["players", "detail", id] as const,
	career: (id: string) => ["players", "career", id] as const,
	gameLog: (id: string, season: number) => ["players", "gameLog", id, season] as const,
};

export function usePlayersList(params: PlayerListParams) {
	return useQuery({
		queryKey: playersKeys.list(params),
		queryFn: ({ signal }) => fetchPlayersList(params, signal),
		placeholderData: keepPreviousData,
	});
}

export function usePlayerDetail(playerId: string) {
	return useQuery({
		queryKey: playersKeys.detail(playerId),
		queryFn: ({ signal }) => fetchPlayerDetail(playerId, signal),
		enabled: Boolean(playerId),
		retry: (failureCount, error) => {
			if ((error as { status?: number }).status === 404) return false;
			return failureCount < 2;
		},
	});
}

export function usePlayerCareer(playerId: string, enabled = true) {
	return useQuery({
		queryKey: playersKeys.career(playerId),
		queryFn: ({ signal }) => fetchPlayerCareer(playerId, signal),
		enabled: Boolean(playerId) && enabled,
	});
}

export function usePlayerGameLog(playerId: string, season: number, enabled = true) {
	return useQuery({
		queryKey: playersKeys.gameLog(playerId, season),
		queryFn: ({ signal }) => fetchPlayerGameLog(playerId, season, signal),
		enabled: Boolean(playerId) && Number.isFinite(season) && enabled,
	});
}
