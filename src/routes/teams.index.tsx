import { EmptyState } from "@/features/teams/components/EmptyState";
import { TeamCard } from "@/features/teams/components/TeamCard";
import { TeamCardSkeleton } from "@/features/teams/components/TeamCardSkeleton";
import { type LeagueOption, TeamFilters } from "@/features/teams/components/TeamFilters";
import { useTeamsList } from "@/features/teams/hooks";
import { LEAGUES, type League, type Season } from "@/features/teams/types";
import { Alert, Pagination, SimpleGrid, Stack, Text, Title } from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import { IconAlertCircle } from "@tabler/icons-react";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

const PAGE_SIZE = 20;

type TeamsSearch = {
	league?: LeagueOption;
	season?: Season | null;
	q?: string;
	page?: number;
};

function isLeagueOption(value: unknown): value is LeagueOption {
	return (
		value === "all" || (typeof value === "string" && (LEAGUES as readonly string[]).includes(value))
	);
}

export const Route = createFileRoute("/teams/")({
	// Fields are optional so `<Link to="/teams">` callers don't need to specify
	// them; this component fills in defaults below.
	validateSearch: (search: Record<string, unknown>): TeamsSearch => ({
		league: isLeagueOption(search.league) ? search.league : undefined,
		season:
			typeof search.season === "number" && Number.isFinite(search.season)
				? (search.season as Season)
				: undefined,
		q: typeof search.q === "string" && search.q.length > 0 ? search.q : undefined,
		page: typeof search.page === "number" && search.page >= 1 ? search.page : undefined,
	}),
	component: TeamsIndex,
});

function TeamsIndex() {
	const rawSearch = Route.useSearch();
	const search = {
		league: rawSearch.league ?? ("all" as LeagueOption),
		season: rawSearch.season ?? null,
		q: rawSearch.q ?? "",
		page: rawSearch.page ?? 1,
	};
	const navigate = Route.useNavigate();

	// Debounce the search input so we don't refetch on every keystroke.
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

	const queryParams = {
		league: search.league === "all" ? undefined : (search.league as League),
		season: search.season ?? undefined,
		q: search.q || undefined,
		page: search.page,
		pageSize: PAGE_SIZE,
	};

	const teamsQuery = useTeamsList(queryParams);

	const totalPages = teamsQuery.data
		? Math.max(1, Math.ceil(teamsQuery.data.count / PAGE_SIZE))
		: 1;

	const availableSeasonsForLeague: Season[] =
		teamsQuery.data?.availableSeasons && search.league !== "all"
			? teamsQuery.data.availableSeasons[search.league as League]
			: teamsQuery.data
				? Array.from(
						new Set(Object.values(teamsQuery.data.availableSeasons).flat() as Season[]),
					).sort((a, b) => b - a)
				: [];

	const isInitialLoading = teamsQuery.isLoading;
	const isError = teamsQuery.isError;
	const results = teamsQuery.data?.results ?? [];

	return (
		<Stack gap="lg">
			<Stack gap={4}>
				<Title order={2}>Teams</Title>
				<Text c="dimmed">
					Browse teams across the NFL, NCAA, UFL, and CFL. Filter by league or season, or search by
					name.
				</Text>
			</Stack>

			<TeamFilters
				league={search.league}
				season={search.season}
				q={qInput}
				availableSeasons={availableSeasonsForLeague}
				onLeagueChange={(next) =>
					navigate({ search: (prev) => ({ ...prev, league: next, page: 1 }) })
				}
				onSeasonChange={(next) =>
					navigate({ search: (prev) => ({ ...prev, season: next, page: 1 }) })
				}
				onQueryChange={setQInput}
			/>

			{isError ? (
				<Alert color="red" icon={<IconAlertCircle size={16} />} title="Couldn't load teams">
					{(teamsQuery.error as Error).message}
				</Alert>
			) : isInitialLoading ? (
				<SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
					{["s1", "s2", "s3", "s4", "s5", "s6"].map((key) => (
						<TeamCardSkeleton key={key} />
					))}
				</SimpleGrid>
			) : results.length === 0 ? (
				<EmptyState
					title="No teams match your filters"
					description="Try clearing the search or switching leagues."
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
					<SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
						{results.map((team) => (
							<TeamCard key={team.id} team={team} />
						))}
					</SimpleGrid>
					{totalPages > 1 ? (
						<Pagination
							value={search.page}
							total={totalPages}
							onChange={(page) => navigate({ search: (prev) => ({ ...prev, page }) })}
							aria-label="Team list pagination"
							mx="auto"
						/>
					) : null}
				</>
			)}
		</Stack>
	);
}
