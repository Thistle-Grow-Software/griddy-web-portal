import { BioTab } from "@/features/players/components/BioTab";
import { CareerStatsTab } from "@/features/players/components/CareerStatsTab";
import { GameLogTab } from "@/features/players/components/GameLogTab";
import { PlayerHero, PlayerHeroSkeleton } from "@/features/players/components/PlayerHero";
import { usePlayerDetail } from "@/features/players/hooks";
import { EmptyState } from "@/features/teams/components/EmptyState";
import { Alert, Button, Stack, Tabs } from "@mantine/core";
import { IconAlertCircle } from "@tabler/icons-react";
import { Link, createFileRoute } from "@tanstack/react-router";

const TABS = ["career", "gameLog", "bio"] as const;
type TabValue = (typeof TABS)[number];

function isTabValue(value: unknown): value is TabValue {
	return typeof value === "string" && (TABS as readonly string[]).includes(value);
}

type PlayerDetailSearch = { tab?: TabValue; season?: number };

export const Route = createFileRoute("/players/$playerId")({
	validateSearch: (search: Record<string, unknown>): PlayerDetailSearch => ({
		tab: isTabValue(search.tab) ? search.tab : undefined,
		season:
			typeof search.season === "number" && Number.isFinite(search.season)
				? search.season
				: undefined,
	}),
	component: PlayerDetail,
});

function PlayerDetail() {
	const { playerId } = Route.useParams();
	const search = Route.useSearch();
	const tab: TabValue = search.tab ?? "career";
	const navigate = Route.useNavigate();

	const detailQuery = usePlayerDetail(playerId);

	if (detailQuery.isLoading) {
		return (
			<Stack gap="lg">
				<PlayerHeroSkeleton />
			</Stack>
		);
	}

	if (detailQuery.isError) {
		const status = (detailQuery.error as { status?: number }).status;
		if (status === 404) {
			return (
				<EmptyState
					title="Player not found"
					description={`No player matches ID "${playerId}".`}
					action={{
						label: "Back to players",
						onClick: () => navigate({ to: "/players" }),
					}}
				/>
			);
		}
		return (
			<Alert color="red" icon={<IconAlertCircle size={16} />} title="Couldn't load player">
				{(detailQuery.error as Error).message}
			</Alert>
		);
	}

	const player = detailQuery.data;
	if (!player) return null;

	const season = search.season ?? player.currentSeason;

	return (
		<Stack gap="lg">
			<PlayerHero player={player} />
			<Link to="/players" style={{ alignSelf: "flex-start", textDecoration: "none" }}>
				<Button variant="subtle" size="xs">
					← Back to players
				</Button>
			</Link>
			<Tabs
				value={tab}
				onChange={(value) => {
					if (isTabValue(value)) {
						navigate({ search: (prev) => ({ ...prev, tab: value }) });
					}
				}}
				keepMounted={false}
			>
				<Tabs.List>
					<Tabs.Tab value="career">Career Stats</Tabs.Tab>
					<Tabs.Tab value="gameLog">Game Log</Tabs.Tab>
					<Tabs.Tab value="bio">Bio</Tabs.Tab>
				</Tabs.List>

				<Tabs.Panel value="career" pt="md">
					<CareerStatsTab
						playerId={playerId}
						position={player.position}
						active={tab === "career"}
					/>
				</Tabs.Panel>
				<Tabs.Panel value="gameLog" pt="md">
					<GameLogTab
						playerId={playerId}
						position={player.position}
						currentSeason={player.currentSeason}
						season={season}
						onSeasonChange={(next) => navigate({ search: (prev) => ({ ...prev, season: next }) })}
						active={tab === "gameLog"}
					/>
				</Tabs.Panel>
				<Tabs.Panel value="bio" pt="md">
					<BioTab bio={player.bio} />
				</Tabs.Panel>
			</Tabs>
		</Stack>
	);
}
