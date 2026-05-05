import { TEAMS } from "@/features/teams/fixtures";
import type { League, Season } from "@/features/teams/types";
import { LEAGUES } from "@/features/teams/types";
import type {
	BoxScore,
	BoxScorePlayerLine,
	BoxScoreSide,
	BoxScoreTeamTotals,
	Drive,
	DriveOutcome,
	GameDetail,
	GameStatus,
	GameSummary,
	Play,
	PlayResult,
} from "./types";

// Hand-curated seed data for /games. Real data lands when the DRF schema
// catches up — for now, deterministic generators give us enough volume to
// exercise pagination, filters, and the virtualized PBP list.

const SEASONS_BY_LEAGUE: Record<League, Season[]> = {
	NFL: [2025, 2024, 2023],
	NCAA: [2025, 2024],
	UFL: [2025, 2024],
	CFL: [2025, 2024],
};

const WEEKS_BY_LEAGUE: Record<League, number> = {
	NFL: 6, // capped to keep fixture volume manageable while exercising filters
	NCAA: 6,
	UFL: 5,
	CFL: 6,
};

function pad(n: number): string {
	return String(n).padStart(2, "0");
}

type ScheduleTeam = { id: string; name: string; location: string };

function rotateSchedule(
	teams: ScheduleTeam[],
	week: number,
): { home: ScheduleTeam; away: ScheduleTeam }[] {
	// Round-robin pairing — circle method. With odd team counts the last
	// team draws a bye that week (we drop it from the matchups).
	const list = teams.slice();
	if (list.length < 2) return [];
	if (list.length % 2 === 1) list.push({ id: "__bye__", name: "Bye", location: "" });

	const n = list.length;
	const offset = week % (n - 1);
	const rotated: ScheduleTeam[] = [
		list[0],
		...list.slice(1 + offset),
		...list.slice(1, 1 + offset),
	];
	const half = n / 2;
	const pairs: { home: ScheduleTeam; away: ScheduleTeam }[] = [];
	for (let i = 0; i < half; i++) {
		const a = rotated[i];
		const b = rotated[n - 1 - i];
		if (a.id === "__bye__" || b.id === "__bye__") continue;
		// Alternate home/away per week so the same team isn't always at home.
		pairs.push(week % 2 === 0 ? { home: a, away: b } : { home: b, away: a });
	}
	return pairs;
}

function statusForWeek(week: number, totalWeeks: number): GameStatus {
	if (week < totalWeeks - 1) return "final";
	if (week === totalWeeks - 1) return "in_progress";
	return "scheduled";
}

function makeScores(
	seed: number,
	status: GameStatus,
): { home: number | null; away: number | null } {
	if (status === "scheduled") return { home: null, away: null };
	const home = 14 + (seed % 24);
	const away = 10 + ((seed * 3) % 24);
	return { home, away };
}

function gameId(league: League, season: Season, week: number, homeId: string, awayId: string) {
	return `${league.toLowerCase()}-${season}-w${pad(week)}-${awayId}-at-${homeId}`;
}

const FIXTURE_DETAILS: GameDetail[] = [];

(function build() {
	let seed = 0;
	for (const league of LEAGUES) {
		const leagueTeams = TEAMS.filter((t) => t.league === league).map((t) => ({
			id: t.id,
			name: t.name,
			location: t.location,
			venue: t.venue,
		}));
		const totalWeeks = WEEKS_BY_LEAGUE[league];
		for (const season of SEASONS_BY_LEAGUE[league]) {
			for (let week = 1; week <= totalWeeks; week++) {
				const pairs = rotateSchedule(leagueTeams, week);
				const status = statusForWeek(week, totalWeeks);
				for (const { home, away } of pairs) {
					seed++;
					const scores = makeScores(seed, status);
					// Date: spread weeks across Sept–Dec of the season year.
					const date = new Date(season, 8, 7 + (week - 1) * 7, 13 + (seed % 8), 0).toISOString();
					const homeFull = leagueTeams.find((t) => t.id === home.id);
					const awayFull = leagueTeams.find((t) => t.id === away.id);
					if (!homeFull || !awayFull) continue;
					FIXTURE_DETAILS.push({
						id: gameId(league, season, week, home.id, away.id),
						league,
						season,
						week,
						date,
						status,
						homeTeamId: home.id,
						homeTeamName: `${homeFull.location} ${homeFull.name}`,
						homeScore: scores.home,
						awayTeamId: away.id,
						awayTeamName: `${awayFull.location} ${awayFull.name}`,
						awayScore: scores.away,
						venue: homeFull.venue,
						weather:
							status === "scheduled"
								? null
								: (["Clear, 62°F", "Cloudy, 48°F", "Light rain, 55°F", "Indoor"][seed % 4] ?? null),
					});
				}
			}
		}
	}
})();

export const GAMES: GameDetail[] = FIXTURE_DETAILS;

export const GAME_DETAILS: Map<string, GameDetail> = new Map(GAMES.map((g) => [g.id, g]));

export const AVAILABLE_SEASONS: Record<League, Season[]> = SEASONS_BY_LEAGUE;

export const AVAILABLE_WEEKS: Record<League, number[]> = Object.fromEntries(
	(LEAGUES as readonly League[]).map((l) => [
		l,
		Array.from({ length: WEEKS_BY_LEAGUE[l] }, (_, i) => i + 1),
	]),
) as Record<League, number[]>;

export function summarize(game: GameDetail): GameSummary {
	const { venue: _v, weather: _w, ...summary } = game;
	return summary;
}

// ---- Box score generation ----

function teamRoster(teamId: string) {
	const team = TEAMS.find((t) => t.id === teamId);
	if (!team) return [];
	return team.roster.map((p) => ({
		playerId: p.id,
		name: p.name,
		position: p.position,
	}));
}

function buildSide(teamId: string, teamName: string, points: number, seed: number): BoxScoreSide {
	const roster = teamRoster(teamId);
	const players: BoxScorePlayerLine[] = roster.map((p, i) => {
		const stats: BoxScorePlayerLine["stats"] = {};
		const wiggle = (n: number) => n + ((seed + i) % 9);
		switch (p.position) {
			case "QB":
				stats.passYards = wiggle(220);
				stats.passTds = (seed + i) % 4;
				stats.passInts = (seed + i + 1) % 3 === 0 ? 1 : 0;
				stats.rushYards = wiggle(15);
				break;
			case "RB":
				stats.rushYards = wiggle(60);
				stats.rushTds = (seed + i) % 5 === 0 ? 1 : 0;
				stats.receptions = (seed + i) % 6;
				stats.recYards = wiggle(20);
				break;
			case "WR":
			case "TE":
				stats.receptions = 2 + ((seed + i) % 7);
				stats.recYards = wiggle(40);
				stats.recTds = (seed + i) % 6 === 0 ? 1 : 0;
				break;
			case "DL":
			case "LB":
				stats.tackles = 3 + ((seed + i) % 7);
				stats.sacks = (seed + i) % 6 === 0 ? 1 : 0;
				break;
			case "CB":
			case "S":
				stats.tackles = 2 + ((seed + i) % 5);
				stats.interceptions = (seed + i) % 8 === 0 ? 1 : 0;
				break;
			default:
				break;
		}
		return { ...p, stats };
	});

	const totals: BoxScoreTeamTotals = {
		teamId,
		teamName,
		points,
		totalYards: 280 + (seed % 220),
		passingYards: 180 + (seed % 140),
		rushingYards: 90 + (seed % 110),
		turnovers: seed % 4,
		firstDowns: 14 + (seed % 12),
		thirdDownConversions: `${4 + (seed % 6)}/${10 + (seed % 5)}`,
		timeOfPossession: `${28 + (seed % 7)}:${pad((seed * 13) % 60)}`,
	};
	return { totals, players };
}

export function buildBoxScore(gameId: string): BoxScore | null {
	const game = GAME_DETAILS.get(gameId);
	if (!game || game.status === "scheduled") return null;
	const seed = Math.abs(hashString(gameId)) % 1000;
	return {
		home: buildSide(game.homeTeamId, game.homeTeamName, game.homeScore ?? 0, seed),
		away: buildSide(game.awayTeamId, game.awayTeamName, game.awayScore ?? 0, seed + 17),
	};
}

// ---- Play-by-play generation ----

const PLAY_TEMPLATES: {
	result: PlayResult;
	description: (yds: number) => string;
	yards: number;
}[] = [
	{ result: "rush", description: (y) => `Rush up the middle for ${y} yards.`, yards: 4 },
	{ result: "rush", description: (y) => `Outside zone left, ${y}-yard gain.`, yards: 6 },
	{ result: "complete", description: (y) => `Quick slant complete for ${y} yards.`, yards: 8 },
	{ result: "complete", description: (y) => `Play-action deep ball, ${y}-yard catch.`, yards: 22 },
	{ result: "incomplete", description: () => "Incomplete pass over the middle.", yards: 0 },
	{ result: "sack", description: (y) => `Sacked for a loss of ${Math.abs(y)} yards.`, yards: -7 },
	{ result: "penalty", description: () => "Holding, offense. 10-yard penalty.", yards: -10 },
];

function hashString(s: string): number {
	let h = 0;
	for (let i = 0; i < s.length; i++) {
		h = ((h << 5) - h + s.charCodeAt(i)) | 0;
	}
	return h;
}

function pickFrom<T>(arr: readonly T[], seed: number): T {
	return arr[Math.abs(seed) % arr.length] as T;
}

function clockString(secondsRemaining: number): string {
	const m = Math.max(0, Math.floor(secondsRemaining / 60));
	const s = Math.max(0, secondsRemaining % 60);
	return `${m}:${pad(s)}`;
}

const DRIVE_OUTCOMES: DriveOutcome[] = [
	"Touchdown",
	"Field Goal",
	"Punt",
	"Punt",
	"Turnover on Downs",
	"Interception",
	"Fumble",
	"Missed FG",
];

export function buildPlayByPlay(gameId: string): { gameId: string; drives: Drive[] } | null {
	const game = GAME_DETAILS.get(gameId);
	if (!game || game.status === "scheduled") return null;
	const seed = Math.abs(hashString(gameId));

	// Volume: the first game per league/season gets 160+ plays to exercise the
	// virtualization claim in the AC; the rest get 60–90.
	const featured = isFeatured(gameId);
	const targetPlays = featured ? 170 : 60 + (seed % 30);

	const drives: Drive[] = [];
	let playCount = 0;
	let driveIndex = 0;
	let secondsLeft = 15 * 60; // start of Q1
	let quarter: 1 | 2 | 3 | 4 | 5 = 1;
	let possession = seed % 2 === 0 ? game.homeTeamId : game.awayTeamId;
	const teamName = (id: string) => (id === game.homeTeamId ? game.homeTeamName : game.awayTeamName);

	while (playCount < targetPlays && quarter <= 4) {
		const driveSeed = seed + driveIndex;
		const driveLength = 4 + (driveSeed % 9); // 4–12 plays
		const plays: Play[] = [];
		let down: 1 | 2 | 3 | 4 = 1;
		let distance = 10;
		let yardline = 25 + (driveSeed % 50);

		for (let p = 0; p < driveLength && playCount < targetPlays; p++) {
			const tpl = pickFrom(PLAY_TEMPLATES, driveSeed + p);
			const yards = tpl.yards + ((driveSeed + p) % 5) - 2;
			const description = tpl.description(yards);
			secondsLeft = Math.max(0, secondsLeft - (15 + (p % 25)));
			plays.push({
				id: `${gameId}-d${driveIndex}-p${p}`,
				driveId: `${gameId}-d${driveIndex}`,
				quarter,
				gameClock: clockString(secondsLeft),
				possessionTeamId: possession,
				down,
				distance,
				yardLine: `${possession === game.homeTeamId ? "HOME" : "AWAY"} ${yardline}`,
				description,
				yards,
				result: tpl.result,
				scoringPlay: false,
			});
			playCount++;

			// Advance down/distance crudely.
			distance -= yards;
			yardline += yards;
			if (distance <= 0) {
				down = 1;
				distance = 10;
			} else if (down < 4) {
				down = (down + 1) as 1 | 2 | 3 | 4;
			} else {
				break;
			}

			if (secondsLeft <= 0 && quarter < 4) {
				quarter = (quarter + 1) as 1 | 2 | 3 | 4 | 5;
				secondsLeft = 15 * 60;
			}
		}

		const outcome = pickFrom(DRIVE_OUTCOMES, driveSeed);
		if (plays.length > 0 && (outcome === "Touchdown" || outcome === "Field Goal")) {
			plays[plays.length - 1] = {
				...plays[plays.length - 1],
				scoringPlay: true,
				result: outcome === "Touchdown" ? "touchdown" : "field_goal",
				description: outcome === "Touchdown" ? "Touchdown!" : "Field goal is good.",
			};
		}

		drives.push({
			id: `${gameId}-d${driveIndex}`,
			possessionTeamId: possession,
			possessionTeamName: teamName(possession),
			quarter,
			startClock: clockString(Math.min(15 * 60, secondsLeft + 90)),
			plays,
			outcome,
		});

		driveIndex++;
		possession = possession === game.homeTeamId ? game.awayTeamId : game.homeTeamId;
		if (secondsLeft <= 0 && quarter < 4) {
			quarter = (quarter + 1) as 1 | 2 | 3 | 4 | 5;
			secondsLeft = 15 * 60;
		}
	}

	return { gameId, drives };
}

function isFeatured(id: string): boolean {
	// First game per league at season 2025, week 1 — the "showcase" game.
	return /-2025-w01-/.test(id);
}
