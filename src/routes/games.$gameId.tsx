import { BoxScoreTab } from "@/features/games/components/BoxScoreTab";
import { FilmTab } from "@/features/games/components/FilmTab";
import { GameHero, GameHeroSkeleton } from "@/features/games/components/GameHero";
import { PlayByPlayTab } from "@/features/games/components/PlayByPlayTab";
import { useGameDetail, useGamePlayback } from "@/features/games/hooks";
import { EmptyState } from "@/features/teams/components/EmptyState";
import { Alert, Button, Stack, Tabs } from "@mantine/core";
import { IconAlertCircle } from "@tabler/icons-react";
import { Link, createFileRoute } from "@tanstack/react-router";

const TABS = ["box", "pbp", "film"] as const;
type TabValue = (typeof TABS)[number];

function isTabValue(value: unknown): value is TabValue {
	return typeof value === "string" && (TABS as readonly string[]).includes(value);
}

type GameDetailSearch = { tab?: TabValue };

export const Route = createFileRoute("/games/$gameId")({
	validateSearch: (search: Record<string, unknown>): GameDetailSearch => ({
		tab: isTabValue(search.tab) ? search.tab : undefined,
	}),
	component: GameDetail,
});

function GameDetail() {
	const { gameId } = Route.useParams();
	const search = Route.useSearch();
	const tab: TabValue = search.tab ?? "box";
	const navigate = Route.useNavigate();

	const detailQuery = useGameDetail(gameId);

	// Resolve film availability up front so the Film tab can be hidden when the
	// game predates the catalog (TGF-335). The API answers 404 for no-film
	// games; while the query is in flight we keep the tab so it doesn't flicker
	// out for games that do have film. FilmTab re-reads the same cached query.
	const playbackQuery = useGamePlayback(gameId);
	const filmUnavailable =
		playbackQuery.isError && (playbackQuery.error as { status?: number }).status === 404;
	const showFilmTab = !filmUnavailable;
	// A deep link to ?tab=film on a no-film game falls back to the box score.
	const effectiveTab: TabValue = tab === "film" && !showFilmTab ? "box" : tab;

	if (detailQuery.isLoading) {
		return (
			<Stack gap="lg">
				<GameHeroSkeleton />
			</Stack>
		);
	}

	if (detailQuery.isError) {
		const status = (detailQuery.error as { status?: number }).status;
		if (status === 404) {
			return (
				<EmptyState
					title="Game not found"
					description={`No game matches ID "${gameId}".`}
					action={{
						label: "Back to games",
						onClick: () => navigate({ to: "/games" }),
					}}
				/>
			);
		}
		return (
			<Alert color="red" icon={<IconAlertCircle size={16} />} title="Couldn't load game">
				{(detailQuery.error as Error).message}
			</Alert>
		);
	}

	const game = detailQuery.data;
	if (!game) return null;

	return (
		<Stack gap="lg">
			<GameHero game={game} />
			<Link to="/games" style={{ alignSelf: "flex-start", textDecoration: "none" }}>
				<Button variant="subtle" size="xs">
					← Back to games
				</Button>
			</Link>
			<Tabs
				value={effectiveTab}
				onChange={(value) => {
					if (isTabValue(value)) {
						navigate({ search: (prev) => ({ ...prev, tab: value }) });
					}
				}}
				keepMounted={false}
			>
				<Tabs.List>
					<Tabs.Tab value="box">Box Score</Tabs.Tab>
					<Tabs.Tab value="pbp">Play-by-Play</Tabs.Tab>
					{showFilmTab ? <Tabs.Tab value="film">Film</Tabs.Tab> : null}
				</Tabs.List>

				<Tabs.Panel value="box" pt="md">
					<BoxScoreTab gameId={gameId} active={effectiveTab === "box"} />
				</Tabs.Panel>
				<Tabs.Panel value="pbp" pt="md">
					<PlayByPlayTab gameId={gameId} active={effectiveTab === "pbp"} />
				</Tabs.Panel>
				{showFilmTab ? (
					<Tabs.Panel value="film" pt="md">
						<FilmTab gameId={gameId} active={effectiveTab === "film"} />
					</Tabs.Panel>
				) : null}
			</Tabs>
		</Stack>
	);
}
