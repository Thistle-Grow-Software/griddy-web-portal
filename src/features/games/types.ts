// Local domain types for the games feature. Mirrors src/features/players —
// will be replaced with re-exports from @/api/generated when the DRF schema
// lands.

import type { League, Season } from "@/features/teams/types";

export type GameStatus = "scheduled" | "in_progress" | "final";

export const GAME_STATUSES: readonly GameStatus[] = ["scheduled", "in_progress", "final"];

export type GameSummary = {
	id: string;
	league: League;
	season: Season;
	week: number;
	date: string; // ISO timestamp
	status: GameStatus;
	homeTeamId: string;
	homeTeamName: string;
	homeScore: number | null;
	awayTeamId: string;
	awayTeamName: string;
	awayScore: number | null;
};

export type GameDetail = GameSummary & {
	venue: string | null;
	weather: string | null;
};

export type GameListParams = {
	league?: League;
	season?: Season;
	week?: number;
	teamIds?: string[];
	status?: GameStatus;
	page?: number;
	pageSize?: number;
};

export type GameListResponse = {
	count: number;
	page: number;
	pageSize: number;
	results: GameSummary[];
	availableSeasons: Record<League, Season[]>;
	/** Per-league/season weeks present in the dataset, e.g. NFL → [1..18]. */
	availableWeeks: Record<League, number[]>;
};

/** Team-level totals for one side of the box score. */
export type BoxScoreTeamTotals = {
	teamId: string;
	teamName: string;
	points: number;
	totalYards: number;
	passingYards: number;
	rushingYards: number;
	turnovers: number;
	firstDowns: number;
	thirdDownConversions: string; // e.g. "6/13"
	timeOfPossession: string; // e.g. "31:24"
};

/** Compact per-player line. Reuses the position-aware stat shape from players. */
export type BoxScorePlayerLine = {
	playerId: string;
	name: string;
	position: string;
	stats: {
		passYards?: number;
		passTds?: number;
		passInts?: number;
		rushYards?: number;
		rushTds?: number;
		receptions?: number;
		recYards?: number;
		recTds?: number;
		tackles?: number;
		sacks?: number;
		interceptions?: number;
	};
};

export type BoxScoreSide = {
	totals: BoxScoreTeamTotals;
	players: BoxScorePlayerLine[];
};

export type BoxScore = {
	home: BoxScoreSide;
	away: BoxScoreSide;
};

export type PlayResult =
	| "complete"
	| "incomplete"
	| "rush"
	| "sack"
	| "touchdown"
	| "field_goal"
	| "punt"
	| "interception"
	| "fumble"
	| "penalty"
	| "kickoff";

export type Play = {
	id: string;
	driveId: string;
	quarter: 1 | 2 | 3 | 4 | 5; // 5 = OT
	gameClock: string; // e.g. "11:32"
	possessionTeamId: string;
	down: 1 | 2 | 3 | 4 | null;
	distance: number | null;
	yardLine: string; // e.g. "KC 35"
	description: string;
	yards: number | null;
	result: PlayResult;
	scoringPlay: boolean;
};

export type DriveOutcome =
	| "Touchdown"
	| "Field Goal"
	| "Punt"
	| "Turnover on Downs"
	| "Interception"
	| "Fumble"
	| "Missed FG"
	| "End of Half"
	| "End of Game";

export type Drive = {
	id: string;
	possessionTeamId: string;
	possessionTeamName: string;
	quarter: 1 | 2 | 3 | 4 | 5;
	startClock: string;
	plays: Play[];
	outcome: DriveOutcome;
};

export type PlayByPlay = {
	gameId: string;
	drives: Drive[];
};
