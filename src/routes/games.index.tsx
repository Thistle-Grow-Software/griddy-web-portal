import {
	GameFilters,
	type LeagueOption,
	type StatusOption,
} from "@/features/games/components/GameFilters";
import { GameTable } from "@/features/games/components/GameTable";
import { useGamesList } from "@/features/games/hooks";
import { GAME_STATUSES, type GameStatus } from "@/features/games/types";
import { EmptyState } from "@/features/teams/components/EmptyState";
import { useTeamsList } from "@/features/teams/hooks";
import { LEAGUES, type League } from "@/features/teams/types";
import { Alert, Pagination, Skeleton, Stack, Text, Title } from "@mantine/core";
import { IconAlertCircle } from "@tabler/icons-react";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";

const PAGE_SIZE = 25;

type GamesSearch = {
	league?: LeagueOption;
	season?: number;
	week?: number;
	teams?: string[];
	status?: StatusOption;
	page?: number;
};

function isLeagueOption(value: unknown): value is LeagueOption {
	return (
		value === "all" || (typeof value === "string" && (LEAGUES as readonly string[]).includes(value))
	);
}

function isStatusOption(value: unknown): value is StatusOption {
	return (
		value === "all" ||
		(typeof value === "string" && (GAME_STATUSES as readonly string[]).includes(value))
	);
}

export const Route = createFileRoute("/games/")({
	validateSearch: (search: Record<string, unknown>): GamesSearch => ({
		league: isLeagueOption(search.league) ? search.league : undefined,
		season:
			typeof search.season === "number" && Number.isFinite(search.season)
				? search.season
				: undefined,
		week:
			typeof search.week === "number" && Number.isFinite(search.week) && search.week >= 1
				? search.week
				: undefined,
		teams:
			Array.isArray(search.teams) && search.teams.every((v) => typeof v === "string")
				? (search.teams as string[])
				: undefined,
		status: isStatusOption(search.status) ? search.status : undefined,
		page: typeof search.page === "number" && search.page >= 1 ? search.page : undefined,
	}),
	component: GamesIndex,
});

function GamesIndex() {
	const rawSearch = Route.useSearch();
	const navigate = Route.useNavigate();

	const search = {
		league: rawSearch.league ?? ("all" as LeagueOption),
		season: rawSearch.season ?? null,
		week: rawSearch.week ?? null,
		teams: rawSearch.teams ?? [],
		status: rawSearch.status ?? ("all" as StatusOption),
		page: rawSearch.page ?? 1,
	};

	const queryParams = useMemo(
		() => ({
			league: search.league === "all" ? undefined : (search.league as League),
			season: search.season ?? undefined,
			week: search.week ?? undefined,
			teamIds: search.teams.length > 0 ? search.teams : undefined,
			status: search.status === "all" ? undefined : (search.status as GameStatus),
			page: search.page,
			pageSize: PAGE_SIZE,
		}),
		[search.league, search.season, search.week, search.teams, search.status, search.page],
	);

	const gamesQuery = useGamesList(queryParams);

	// Pull team options scoped to the active league so the dropdown stays
	// focused on relevant teams.
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

	const availableSeasons = useMemo(() => {
		const map = gamesQuery.data?.availableSeasons;
		if (!map) return [] as number[];
		if (search.league === "all") {
			const all = new Set<number>();
			for (const list of Object.values(map)) for (const s of list) all.add(s);
			return Array.from(all).sort((a, b) => b - a);
		}
		return map[search.league as League] ?? [];
	}, [gamesQuery.data?.availableSeasons, search.league]);

	const availableWeeks = useMemo(() => {
		const map = gamesQuery.data?.availableWeeks;
		if (!map) return [] as number[];
		if (search.league === "all") {
			const all = new Set<number>();
			for (const list of Object.values(map)) for (const w of list) all.add(w);
			return Array.from(all).sort((a, b) => a - b);
		}
		return map[search.league as League] ?? [];
	}, [gamesQuery.data?.availableWeeks, search.league]);

	const totalPages = gamesQuery.data
		? Math.max(1, Math.ceil(gamesQuery.data.count / PAGE_SIZE))
		: 1;

	const isError = gamesQuery.isError;
	const isLoading = gamesQuery.isLoading;
	const results = gamesQuery.data?.results ?? [];

	return (
		<Stack gap="lg">
			<Stack gap={4}>
				<Title order={2}>Games</Title>
				<Text c="dimmed">
					Browse games across the NFL, NCAA, UFL, and CFL. Filter by league, season, week, team, or
					status.
				</Text>
			</Stack>

			<GameFilters
				league={search.league}
				season={search.season}
				week={search.week}
				teamIds={search.teams}
				status={search.status}
				availableSeasons={availableSeasons}
				availableWeeks={availableWeeks}
				teamOptions={teamOptions}
				onLeagueChange={(next) =>
					navigate({
						search: (prev) => ({
							...prev,
							league: next === "all" ? undefined : next,
							// Selected team IDs may not belong to the new league.
							teams: undefined,
							page: 1,
						}),
					})
				}
				onSeasonChange={(next) =>
					navigate({
						search: (prev) => ({ ...prev, season: next ?? undefined, page: 1 }),
					})
				}
				onWeekChange={(next) =>
					navigate({
						search: (prev) => ({ ...prev, week: next ?? undefined, page: 1 }),
					})
				}
				onStatusChange={(next) =>
					navigate({
						search: (prev) => ({
							...prev,
							status: next === "all" ? undefined : next,
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
			/>

			{isError ? (
				<Alert color="red" icon={<IconAlertCircle size={16} />} title="Couldn't load games">
					{(gamesQuery.error as Error).message}
				</Alert>
			) : isLoading ? (
				<Skeleton height={500} radius="sm" data-testid="game-table-skeleton" />
			) : results.length === 0 ? (
				<EmptyState
					title="No games match your filters"
					description="Try widening the filters or clearing them."
					action={{
						label: "Clear filters",
						onClick: () => navigate({ search: () => ({}) }),
					}}
				/>
			) : (
				<>
					<GameTable games={results} />
					<Text size="sm" c="dimmed" ta="right">
						{gamesQuery.data?.count.toLocaleString() ?? 0} games match
					</Text>
					{totalPages > 1 ? (
						<Pagination
							value={search.page}
							total={totalPages}
							onChange={(page) => navigate({ search: (prev) => ({ ...prev, page }) })}
							aria-label="Game list pagination"
							mx="auto"
						/>
					) : null}
				</>
			)}
		</Stack>
	);
}
