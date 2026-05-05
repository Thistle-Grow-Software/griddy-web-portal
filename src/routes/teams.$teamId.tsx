import { EmptyState } from "@/features/teams/components/EmptyState";
import { RosterTab } from "@/features/teams/components/RosterTab";
import { ScheduleTab } from "@/features/teams/components/ScheduleTab";
import { StatsTab } from "@/features/teams/components/StatsTab";
import { TeamHero, TeamHeroSkeleton } from "@/features/teams/components/TeamHero";
import { useTeamDetail } from "@/features/teams/hooks";
import { Alert, Button, Stack, Tabs } from "@mantine/core";
import { IconAlertCircle } from "@tabler/icons-react";
import { Link, createFileRoute } from "@tanstack/react-router";

const TABS = ["roster", "schedule", "stats"] as const;
type TabValue = (typeof TABS)[number];

function isTabValue(value: unknown): value is TabValue {
	return typeof value === "string" && (TABS as readonly string[]).includes(value);
}

export const Route = createFileRoute("/teams/$teamId")({
	// Field is optional in the type so `<Link to="/teams/$teamId">` callers
	// don't need to specify it; the component falls back to "roster".
	validateSearch: (search: Record<string, unknown>): { tab?: TabValue } => ({
		tab: isTabValue(search.tab) ? search.tab : undefined,
	}),
	component: TeamDetail,
});

function TeamDetail() {
	const { teamId } = Route.useParams();
	const search = Route.useSearch();
	const tab: TabValue = search.tab ?? "roster";
	const navigate = Route.useNavigate();

	const detailQuery = useTeamDetail(teamId);

	if (detailQuery.isLoading) {
		return (
			<Stack gap="lg">
				<TeamHeroSkeleton />
			</Stack>
		);
	}

	if (detailQuery.isError) {
		const status = (detailQuery.error as { status?: number }).status;
		if (status === 404) {
			return (
				<EmptyState
					title="Team not found"
					description={`No team matches ID "${teamId}".`}
					action={{
						label: "Back to teams",
						onClick: () => navigate({ to: "/teams" }),
					}}
				/>
			);
		}
		return (
			<Alert color="red" icon={<IconAlertCircle size={16} />} title="Couldn't load team">
				{(detailQuery.error as Error).message}
			</Alert>
		);
	}

	const team = detailQuery.data;
	if (!team) return null;

	return (
		<Stack gap="lg">
			<TeamHero team={team} />
			<Link to="/teams" style={{ alignSelf: "flex-start", textDecoration: "none" }}>
				<Button variant="subtle" size="xs">
					← Back to teams
				</Button>
			</Link>
			<Tabs
				value={tab}
				onChange={(value) => {
					if (isTabValue(value)) {
						navigate({ search: { tab: value } });
					}
				}}
				keepMounted={false}
			>
				<Tabs.List>
					<Tabs.Tab value="roster">Roster</Tabs.Tab>
					<Tabs.Tab value="schedule">Schedule</Tabs.Tab>
					<Tabs.Tab value="stats">Season Stats</Tabs.Tab>
				</Tabs.List>

				<Tabs.Panel value="roster" pt="md">
					<RosterTab teamId={teamId} active={tab === "roster"} />
				</Tabs.Panel>
				<Tabs.Panel value="schedule" pt="md">
					<ScheduleTab teamId={teamId} active={tab === "schedule"} />
				</Tabs.Panel>
				<Tabs.Panel value="stats" pt="md">
					<StatsTab teamId={teamId} active={tab === "stats"} />
				</Tabs.Panel>
			</Tabs>
		</Stack>
	);
}
