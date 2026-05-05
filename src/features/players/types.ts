// Local domain types for the players feature. Mirrors src/features/teams —
// will be replaced with re-exports from @/api/generated when the DRF schema
// lands.

import type { League } from "@/features/teams/types";

export type Position = "QB" | "RB" | "WR" | "TE" | "OL" | "DL" | "LB" | "CB" | "S" | "K" | "P";

export const POSITIONS: readonly Position[] = [
	"QB",
	"RB",
	"WR",
	"TE",
	"OL",
	"DL",
	"LB",
	"CB",
	"S",
	"K",
	"P",
];

export type PlayerSummary = {
	id: string;
	name: string;
	position: Position;
	jersey: number | null;
	teamId: string;
	teamName: string;
	league: League;
	active: boolean;
	currentSeason: number;
	keyStats: PlayerKeyStats;
};

/**
 * Compact stat summary surfaced on the browse table. Position-specific —
 * keys are optional so the UI shows "—" for stats that don't apply.
 */
export type PlayerKeyStats = {
	passYards?: number;
	passTds?: number;
	rushYards?: number;
	rushTds?: number;
	receptions?: number;
	recYards?: number;
	tackles?: number;
	sacks?: number;
};

export type PlayerListResponse = {
	count: number;
	page: number;
	pageSize: number;
	results: PlayerSummary[];
};

export type PlayerListParams = {
	q?: string;
	league?: League;
	position?: Position;
	teamIds?: string[];
	active?: boolean;
	page?: number;
	pageSize?: number;
};

export type PlayerBio = {
	dateOfBirth: string | null;
	birthplace: string | null;
	college: string | null;
	draftYear: number | null;
	draftRound: number | null;
	draftPick: number | null;
};

export type PlayerDetail = PlayerSummary & {
	heightInches: number | null;
	weightPounds: number | null;
	headshotUrl: string | null;
	bio: PlayerBio;
};

/** Per-season aggregated stat line. */
export type CareerSeason = {
	season: number;
	league: League;
	teamId: string;
	teamName: string;
	gamesPlayed: number;
	stats: PlayerKeyStats;
};

/** Per-game stat line for the game log. */
export type GameLogEntry = {
	gameId: string;
	week: number;
	date: string; // ISO timestamp
	opponentId: string;
	opponentName: string;
	isHome: boolean;
	stats: PlayerKeyStats;
};
