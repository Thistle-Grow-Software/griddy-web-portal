import {
	type LeagueOption,
	PlayerFilters,
	type PositionOption,
} from "@/features/players/components/PlayerFilters";
import { VirtualPlayerTable } from "@/features/players/components/VirtualPlayerTable";
import { usePlayersList } from "@/features/players/hooks";
import { POSITIONS, type Position } from "@/features/players/types";
import { EmptyState } from "@/features/teams/components/EmptyState";
import { useTeamsList } from "@/features/teams/hooks";
import { LEAGUES, type League } from "@/features/teams/types";
import { Alert, Pagination, Skeleton, Stack, Text, Title } from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import { IconAlertCircle } from "@tabler/icons-react";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";

const PAGE_SIZE = 100;

type PlayersSearch = {
	q?: string;
	league?: LeagueOption;
	position?: PositionOption;
	teams?: string[];
	active?: boolean;
	page?: number;
};

function isLeagueOption(value: unknown): value is LeagueOption {
	return (
		value === "all" || (typeof value === "string" && (LEAGUES as readonly string[]).includes(value))
	);
}

function isPositionOption(value: unknown): value is PositionOption {
	return (
		value === "all" ||
		(typeof value === "string" && (POSITIONS as readonly string[]).includes(value))
	);
}

export const Route = createFileRoute("/players/")({
	validateSearch: (search: Record<string, unknown>): PlayersSearch => ({
		q: typeof search.q === "string" && search.q.length > 0 ? search.q : undefined,
		league: isLeagueOption(search.league) ? search.league : undefined,
		position: isPositionOption(search.position) ? search.position : undefined,
		teams:
			Array.isArray(search.teams) && search.teams.every((v) => typeof v === "string")
				? (search.teams as string[])
				: undefined,
		active: typeof search.active === "boolean" ? search.active : undefined,
		page: typeof search.page === "number" && search.page >= 1 ? search.page : undefined,
	}),
	component: PlayersIndex,
});

function PlayersIndex() {
	const rawSearch = Route.useSearch();
	const navigate = Route.useNavigate();

	const search = {
		q: rawSearch.q ?? "",
		league: rawSearch.league ?? ("all" as LeagueOption),
		position: rawSearch.position ?? ("all" as PositionOption),
		teams: rawSearch.teams ?? [],
		active: rawSearch.active ?? false,
		page: rawSearch.page ?? 1,
	};

	// Debounce text search to keep the URL/query churn quiet while typing.
	const [qInput, setQInput] = useState(search.q);
	const [debouncedQ] = useDebouncedValue(qInput, 250);

	useEffect(() => {
		if (debouncedQ === search.q) return;
		navigate({
			search: (prev) => ({
				...prev,
				q: debouncedQ.length > 0 ? debouncedQ : undefined,
				page: 1,
			}),
			replace: true,
		});
	}, [debouncedQ, search.q, navigate]);

	const queryParams = useMemo(
		() => ({
			q: search.q || undefined,
			league: search.league === "all" ? undefined : (search.league as League),
			position: search.position === "all" ? undefined : (search.position as Position),
			teamIds: search.teams.length > 0 ? search.teams : undefined,
			active: search.active ? true : undefined,
			page: search.page,
			pageSize: PAGE_SIZE,
		}),
		[search.q, search.league, search.position, search.teams, search.active, search.page],
	);

	const playersQuery = usePlayersList(queryParams);

	// Pull the team-options list (for the multi-select) from the existing
	// teams list endpoint. Scoped to the active league when one is selected so
	// the dropdown doesn't dump 30+ teams when the user is filtering NFL.
	const teamsQuery = useTeamsList({
		league: search.league === "all" ? undefined : (search.league as League),
		pageSize: 200,
	});
	const teamOptions = useMemo(
		() =>
			(teamsQuery.data?.results ?? []).map((t) => ({
				id: t.id,
				name: `${t.location} ${t.name}`,
			})),
		[teamsQuery.data?.results],
	);

	const totalPages = playersQuery.data
		? Math.max(1, Math.ceil(playersQuery.data.count / PAGE_SIZE))
		: 1;

	const isError = playersQuery.isError;
	const isLoading = playersQuery.isLoading;
	const results = playersQuery.data?.results ?? [];

	return (
		<Stack gap="lg">
			<Stack gap={4}>
				<Title order={2}>Players</Title>
				<Text c="dimmed">
					Search players across the NFL, NCAA, UFL, and CFL. Filter by league, position, team, or
					active status.
				</Text>
			</Stack>

			<PlayerFilters
				q={qInput}
				league={search.league}
				position={search.position}
				teamIds={search.teams}
				active={search.active}
				teamOptions={teamOptions}
				onQueryChange={setQInput}
				onLeagueChange={(next) =>
					navigate({
						search: (prev) => ({
							...prev,
							league: next === "all" ? undefined : next,
							// Clear team filter when switching leagues — selected
							// IDs may not belong to the new league.
							teams: undefined,
							page: 1,
						}),
					})
				}
				onPositionChange={(next) =>
					navigate({
						search: (prev) => ({
							...prev,
							position: next === "all" ? undefined : next,
							page: 1,
						}),
					})
				}
				onTeamIdsChange={(ids) =>
					navigate({
						search: (prev) => ({
							...prev,
							teams: ids.length > 0 ? ids : undefined,
							page: 1,
						}),
					})
				}
				onActiveChange={(next) =>
					navigate({
						search: (prev) => ({
							...prev,
							active: next ? true : undefined,
							page: 1,
						}),
					})
				}
			/>

			{isError ? (
				<Alert color="red" icon={<IconAlertCircle size={16} />} title="Couldn't load players">
					{(playersQuery.error as Error).message}
				</Alert>
			) : isLoading ? (
				<Skeleton height={600} radius="sm" data-testid="player-table-skeleton" />
			) : results.length === 0 ? (
				<EmptyState
					title="No players match your filters"
					description="Try clearing the search or widening the filters."
					action={{
						label: "Clear filters",
						onClick: () => {
							setQInput("");
							navigate({ search: () => ({}) });
						},
					}}
				/>
			) : (
				<>
					<VirtualPlayerTable players={results} />
					<Text size="sm" c="dimmed" ta="right">
						{playersQuery.data?.count.toLocaleString() ?? 0} players match
					</Text>
					{totalPages > 1 ? (
						<Pagination
							value={search.page}
							total={totalPages}
							onChange={(page) => navigate({ search: (prev) => ({ ...prev, page }) })}
							aria-label="Player list pagination"
							mx="auto"
						/>
					) : null}
				</>
			)}
		</Stack>
	);
}
