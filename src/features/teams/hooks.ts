import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
	fetchTeamDetail,
	fetchTeamRoster,
	fetchTeamSchedule,
	fetchTeamStats,
	fetchTeamsList,
} from "./api";
import type { TeamListParams } from "./types";

export const teamsKeys = {
	all: ["teams"] as const,
	list: (params: TeamListParams) => ["teams", "list", params] as const,
	detail: (id: string) => ["teams", "detail", id] as const,
	roster: (id: string) => ["teams", "roster", id] as const,
	schedule: (id: string) => ["teams", "schedule", id] as const,
	stats: (id: string) => ["teams", "stats", id] as const,
};

export function useTeamsList(params: TeamListParams) {
	return useQuery({
		queryKey: teamsKeys.list(params),
		queryFn: ({ signal }) => fetchTeamsList(params, signal),
		// Keep the previous page visible while a new one loads — avoids the cards
		// flashing to a skeleton on every filter tweak.
		placeholderData: keepPreviousData,
	});
}

export function useTeamDetail(teamId: string) {
	return useQuery({
		queryKey: teamsKeys.detail(teamId),
		queryFn: ({ signal }) => fetchTeamDetail(teamId, signal),
		enabled: Boolean(teamId),
		retry: (failureCount, error) => {
			// Don't retry 404s — they're terminal for "team not found".
			if ((error as { status?: number }).status === 404) return false;
			return failureCount < 2;
		},
	});
}

export function useTeamRoster(teamId: string, enabled = true) {
	return useQuery({
		queryKey: teamsKeys.roster(teamId),
		queryFn: ({ signal }) => fetchTeamRoster(teamId, signal),
		enabled: Boolean(teamId) && enabled,
	});
}

export function useTeamSchedule(teamId: string, enabled = true) {
	return useQuery({
		queryKey: teamsKeys.schedule(teamId),
		queryFn: ({ signal }) => fetchTeamSchedule(teamId, signal),
		enabled: Boolean(teamId) && enabled,
	});
}

export function useTeamStats(teamId: string, enabled = true) {
	return useQuery({
		queryKey: teamsKeys.stats(teamId),
		queryFn: ({ signal }) => fetchTeamStats(teamId, signal),
		enabled: Boolean(teamId) && enabled,
	});
}
