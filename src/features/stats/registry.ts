import { POSITIONS } from "@/features/players/types";
import { LEAGUES } from "@/features/teams/types";
import type { ColumnDef, Entity, EntityRegistry, FilterDef } from "./types";

const LEAGUE_OPTIONS = LEAGUES.map((l) => ({ value: l, label: l }));
const POSITION_OPTIONS = POSITIONS.map((p) => ({ value: p, label: p }));
const STATUS_OPTIONS = [
	{ value: "scheduled", label: "Scheduled" },
	{ value: "in_progress", label: "In progress" },
	{ value: "final", label: "Final" },
];
const PLAY_RESULT_OPTIONS = [
	{ value: "rush", label: "Rush" },
	{ value: "complete", label: "Pass — Complete" },
	{ value: "incomplete", label: "Pass — Incomplete" },
	{ value: "sack", label: "Sack" },
	{ value: "touchdown", label: "Touchdown" },
	{ value: "field_goal", label: "Field goal" },
	{ value: "interception", label: "Interception" },
	{ value: "fumble", label: "Fumble" },
	{ value: "penalty", label: "Penalty" },
];
const DOWN_OPTIONS = [
	{ value: "1", label: "1st" },
	{ value: "2", label: "2nd" },
	{ value: "3", label: "3rd" },
	{ value: "4", label: "4th" },
];

const formatNumber = (v: unknown): string =>
	typeof v === "number" && Number.isFinite(v) ? v.toLocaleString() : "—";
const formatBool = (v: unknown): string => (v === true ? "Yes" : v === false ? "No" : "—");
const formatDate = (v: unknown): string => {
	if (typeof v !== "string") return "—";
	try {
		return new Date(v).toLocaleDateString();
	} catch {
		return v;
	}
};
const formatString = (v: unknown): string =>
	v === null || v === undefined || v === "" ? "—" : String(v);

const PLAYS_FILTERS: FilterDef[] = [
	{ id: "league", label: "League", kind: "select", options: LEAGUE_OPTIONS },
	{ id: "season", label: "Season", kind: "text", placeholder: "e.g. 2025" },
	{ id: "team", label: "Team", kind: "text", placeholder: "team id" },
	{ id: "down", label: "Down", kind: "multiselect", options: DOWN_OPTIONS },
	{ id: "result", label: "Play result", kind: "multiselect", options: PLAY_RESULT_OPTIONS },
	{
		id: "yards",
		label: "Yards gained",
		kind: "number-range",
	},
	{ id: "scoring", label: "Scoring play only", kind: "boolean" },
];

const PLAYS_COLUMNS: ColumnDef[] = [
	{ id: "league", label: "League", minWidth: 70 },
	{ id: "season", label: "Season", numeric: true, sortable: true, minWidth: 80 },
	{ id: "week", label: "Wk", numeric: true, sortable: true, minWidth: 50 },
	{ id: "gameLabel", label: "Game", minWidth: 220 },
	{ id: "quarter", label: "Q", numeric: true, sortable: true, minWidth: 40 },
	{ id: "gameClock", label: "Clock", minWidth: 70 },
	{ id: "down", label: "Down", numeric: true, sortable: true, minWidth: 60, format: formatNumber },
	{
		id: "distance",
		label: "Dist",
		numeric: true,
		sortable: true,
		minWidth: 60,
		format: formatNumber,
	},
	{ id: "possessionTeamName", label: "Possession", minWidth: 140 },
	{ id: "description", label: "Play", minWidth: 280 },
	{
		id: "yards",
		label: "Yds",
		numeric: true,
		sortable: true,
		minWidth: 60,
		format: formatNumber,
	},
	{ id: "result", label: "Result", minWidth: 110 },
	{ id: "scoringPlay", label: "Scoring?", minWidth: 80, format: formatBool },
];

const PLAYERS_FILTERS: FilterDef[] = [
	{ id: "league", label: "League", kind: "select", options: LEAGUE_OPTIONS },
	{ id: "position", label: "Position", kind: "multiselect", options: POSITION_OPTIONS },
	{ id: "active", label: "Active only", kind: "boolean" },
	{ id: "q", label: "Name search", kind: "text", placeholder: "search by name" },
];

const PLAYERS_COLUMNS: ColumnDef[] = [
	{ id: "name", label: "Name", sortable: true, minWidth: 180 },
	{ id: "position", label: "Pos", minWidth: 60 },
	{ id: "league", label: "League", minWidth: 80 },
	{ id: "teamName", label: "Team", minWidth: 180 },
	{
		id: "currentSeason",
		label: "Season",
		numeric: true,
		sortable: true,
		minWidth: 80,
	},
	{
		id: "passYards",
		label: "Pass yds",
		numeric: true,
		sortable: true,
		minWidth: 90,
		format: formatNumber,
	},
	{
		id: "passTds",
		label: "Pass TD",
		numeric: true,
		sortable: true,
		minWidth: 80,
		format: formatNumber,
	},
	{
		id: "rushYards",
		label: "Rush yds",
		numeric: true,
		sortable: true,
		minWidth: 90,
		format: formatNumber,
	},
	{
		id: "recYards",
		label: "Rec yds",
		numeric: true,
		sortable: true,
		minWidth: 90,
		format: formatNumber,
	},
	{
		id: "tackles",
		label: "Tackles",
		numeric: true,
		sortable: true,
		minWidth: 80,
		format: formatNumber,
	},
	{
		id: "active",
		label: "Active",
		minWidth: 70,
		format: formatBool,
	},
];

const TEAMS_FILTERS: FilterDef[] = [
	{ id: "league", label: "League", kind: "select", options: LEAGUE_OPTIONS },
	{ id: "season", label: "Season", kind: "text", placeholder: "e.g. 2025" },
	{ id: "q", label: "Name search", kind: "text", placeholder: "search by location/name" },
];

const TEAMS_COLUMNS: ColumnDef[] = [
	{ id: "displayName", label: "Team", sortable: true, minWidth: 200 },
	{ id: "league", label: "League", minWidth: 80 },
	{ id: "wins", label: "W", numeric: true, sortable: true, minWidth: 50 },
	{ id: "losses", label: "L", numeric: true, sortable: true, minWidth: 50 },
	{ id: "ties", label: "T", numeric: true, sortable: true, minWidth: 50 },
	{ id: "currentSeason", label: "Season", numeric: true, sortable: true, minWidth: 80 },
];

const GAMES_FILTERS: FilterDef[] = [
	{ id: "league", label: "League", kind: "select", options: LEAGUE_OPTIONS },
	{ id: "season", label: "Season", kind: "text", placeholder: "e.g. 2025" },
	{ id: "week", label: "Week", kind: "text", placeholder: "e.g. 1" },
	{ id: "status", label: "Status", kind: "multiselect", options: STATUS_OPTIONS },
	{ id: "team", label: "Team", kind: "text", placeholder: "team id" },
];

const GAMES_COLUMNS: ColumnDef[] = [
	{ id: "date", label: "Date", sortable: true, minWidth: 120, format: formatDate },
	{ id: "league", label: "League", minWidth: 80 },
	{ id: "week", label: "Wk", numeric: true, sortable: true, minWidth: 50 },
	{ id: "matchup", label: "Matchup", minWidth: 280 },
	{ id: "score", label: "Score", minWidth: 100, format: formatString },
	{ id: "status", label: "Status", minWidth: 100 },
];

export const REGISTRY: Record<Entity, EntityRegistry> = {
	plays: {
		entity: "plays",
		label: "Plays",
		description: "Every play across every game in the dataset.",
		filters: PLAYS_FILTERS,
		columns: PLAYS_COLUMNS,
		defaultColumns: [
			"league",
			"week",
			"gameLabel",
			"quarter",
			"down",
			"distance",
			"description",
			"yards",
			"result",
		],
		defaultSort: { id: "yards", direction: "desc" },
	},
	players: {
		entity: "players",
		label: "Players",
		description: "Player season totals across leagues.",
		filters: PLAYERS_FILTERS,
		columns: PLAYERS_COLUMNS,
		defaultColumns: [
			"name",
			"position",
			"league",
			"teamName",
			"passYards",
			"rushYards",
			"recYards",
		],
		defaultSort: { id: "name", direction: "asc" },
	},
	teams: {
		entity: "teams",
		label: "Teams",
		description: "Teams across all leagues.",
		filters: TEAMS_FILTERS,
		columns: TEAMS_COLUMNS,
		defaultColumns: ["displayName", "league", "wins", "losses", "currentSeason"],
		defaultSort: { id: "displayName", direction: "asc" },
	},
	games: {
		entity: "games",
		label: "Games",
		description: "Games across leagues, sorted by date.",
		filters: GAMES_FILTERS,
		columns: GAMES_COLUMNS,
		defaultColumns: ["date", "league", "week", "matchup", "score", "status"],
		defaultSort: { id: "date", direction: "desc" },
	},
};
