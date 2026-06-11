// Typed TanStack Query hooks for the `teams` resource (TGF-348).
//
// Convention for src/api/queries/ — one file per API resource, exporting:
//   1. A `<resource>Keys` query-key factory: ["<resource>", "list", filters]
//      and ["<resource>", "detail", id], so invalidation is predictable.
//   2. `use<Resource>List` / `use<Resource>Detail` query hooks whose response
//      types are inferred from the generated client — never hand-written.
//   3. Mutation hooks that invalidate the affected list/detail keys on success.
//
// Components consume these hooks only; the generated client never leaks into
// feature code.
import { teamsCreate, teamsList, teamsPartialUpdate, teamsRetrieve } from "@/api/generated";
import type { PatchedTeamWrite, TeamWrite, TeamsListData } from "@/api/generated";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

/** Filters accepted by the teams list endpoint, derived from the generated client. */
export type TeamListFilters = NonNullable<TeamsListData["query"]>;

export const teamsKeys = {
	all: ["teams"] as const,
	lists: () => [...teamsKeys.all, "list"] as const,
	list: (filters: TeamListFilters) => [...teamsKeys.lists(), filters] as const,
	details: () => [...teamsKeys.all, "detail"] as const,
	detail: (id: number) => [...teamsKeys.details(), id] as const,
};

/** Cursor-paginated team list. Response type: `PaginatedTeamListList`. */
export function useTeamsList(filters: TeamListFilters = {}) {
	return useQuery({
		queryKey: teamsKeys.list(filters),
		queryFn: async ({ signal }) => {
			const { data } = await teamsList({ query: filters, signal, throwOnError: true });
			return data;
		},
	});
}

/** Single team by numeric id. Response type: `TeamDetail`. */
export function useTeamDetail(id: number) {
	return useQuery({
		queryKey: teamsKeys.detail(id),
		queryFn: async ({ signal }) => {
			const { data } = await teamsRetrieve({ path: { id }, signal, throwOnError: true });
			return data;
		},
		enabled: Number.isFinite(id),
	});
}

/** Create a team. Invalidates all team lists on success. */
export function useTeamCreate() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (body: TeamWrite) => {
			const { data } = await teamsCreate({ body, throwOnError: true });
			return data;
		},
		onSuccess: () => queryClient.invalidateQueries({ queryKey: teamsKeys.lists() }),
	});
}

/** Partially update a team. Invalidates team lists and the team's detail on success. */
export function useTeamUpdate() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async ({ id, changes }: { id: number; changes: PatchedTeamWrite }) => {
			const { data } = await teamsPartialUpdate({
				path: { id },
				body: changes,
				throwOnError: true,
			});
			return data;
		},
		onSuccess: (_data, { id }) =>
			Promise.all([
				queryClient.invalidateQueries({ queryKey: teamsKeys.lists() }),
				queryClient.invalidateQueries({ queryKey: teamsKeys.detail(id) }),
			]),
	});
}
