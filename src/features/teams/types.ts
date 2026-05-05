// Local domain types for the teams feature. The Griddy DRF schema is still a
// placeholder (see src/api/schema.yaml), so until the real OpenAPI lands and
// `pnpm gen:api` produces typed Pydantic-equivalents, we model what the UI
// needs and back it with MSW. Swap-out point when the schema is live: replace
// these types with re-exports from `@/api/generated`.

export const LEAGUES = ["NFL", "NCAA", "UFL", "CFL"] as const;
export type League = (typeof LEAGUES)[number];

export type Season = number; // e.g. 2025

export type TeamSummary = {
	id: string;
	name: string;
	location: string;
	logoUrl: string | null;
	league: League;
	currentSeason: Season;
	record: { wins: number; losses: number; ties: number };
};

export type TeamListResponse = {
	count: number;
	page: number;
	pageSize: number;
	results: TeamSummary[];
	availableSeasons: Record<League, Season[]>;
};

export type TeamListParams = {
	league?: League;
	season?: Season;
	q?: string;
	page?: number;
	pageSize?: number;
};

export type RosterPlayer = {
	id: string;
	name: string;
	position: string;
	jersey: number | null;
	heightInches: number | null;
	weightPounds: number | null;
};

export type ScheduleGame = {
	id: string;
	week: number;
	date: string; // ISO timestamp
	opponentId: string;
	opponentName: string;
	isHome: boolean;
	status: "scheduled" | "in_progress" | "final";
	teamScore: number | null;
	opponentScore: number | null;
};

export type SeasonStats = {
	gamesPlayed: number;
	pointsFor: number;
	pointsAgainst: number;
	totalYards: number;
	passingYards: number;
	rushingYards: number;
	turnovers: number;
};

export type TeamDetail = TeamSummary & {
	conference: string | null;
	division: string | null;
	venue: string | null;
};
