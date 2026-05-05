import { TEAMS } from "@/features/teams/fixtures";
import type {
	CareerSeason,
	GameLogEntry,
	PlayerDetail,
	PlayerKeyStats,
	PlayerSummary,
	Position,
} from "./types";

// Position-specific stat profiles. Numbers are deterministic-ish based on a
// seed so test assertions are stable.
function statsForPosition(pos: Position, seed: number): PlayerKeyStats {
	const wiggle = (n: number) => n + (seed % 7) * 11;
	switch (pos) {
		case "QB":
			return { passYards: wiggle(3800), passTds: 24 + (seed % 11), rushYards: 180 };
		case "RB":
			return { rushYards: wiggle(950), rushTds: 6 + (seed % 6), receptions: 32 };
		case "WR":
			return { receptions: 60 + (seed % 30), recYards: wiggle(820), rushTds: 0 };
		case "TE":
			return { receptions: 45 + (seed % 20), recYards: wiggle(540) };
		case "DL":
		case "LB":
			return { tackles: 60 + (seed % 40), sacks: seed % 10 };
		case "CB":
		case "S":
			return { tackles: 50 + (seed % 30) };
		default:
			return {};
	}
}

const NAME_POOL = [
	"James Carter",
	"Marcus Hill",
	"Tyler Brooks",
	"Jordan Reeves",
	"Alex Foster",
	"Cameron Hayes",
	"Devon Walker",
	"Ethan Price",
	"Felix Owens",
	"Grant Mosley",
	"Hudson Park",
	"Isaiah Banks",
	"Jamal Lopez",
	"Kai Sullivan",
	"Logan Reid",
	"Mason Holt",
	"Nathan Quinn",
	"Owen Beck",
	"Parker Cole",
	"Quincy Drake",
	"Riley Vance",
	"Silas Webb",
	"Tristan Yates",
	"Xavier Burns",
	"Asher Coleman",
	"Brody Pierce",
	"Caleb Sutton",
	"Dean Robles",
];

type SeedPlayer = PlayerDetail & {
	career: CareerSeason[];
};

function pickName(index: number): string {
	return `${NAME_POOL[index % NAME_POOL.length]}${
		index >= NAME_POOL.length ? ` ${Math.floor(index / NAME_POOL.length) + 1}` : ""
	}`;
}

const ALL_PLAYERS: SeedPlayer[] = (() => {
	const players: SeedPlayer[] = [];
	let globalIndex = 0;

	for (const team of TEAMS) {
		for (const rosterEntry of team.roster) {
			const position = rosterEntry.position as Position;
			const seed = globalIndex;
			const active = globalIndex % 11 !== 0; // ~9% inactive
			const name = pickName(globalIndex);
			const headshot =
				globalIndex % 5 === 0 ? null : `https://i.pravatar.cc/200?img=${(globalIndex % 70) + 1}`;
			const summary: PlayerSummary = {
				id: rosterEntry.id,
				name,
				position,
				jersey: rosterEntry.jersey,
				teamId: team.id,
				teamName: `${team.location} ${team.name}`,
				league: team.league,
				active,
				currentSeason: team.currentSeason,
				keyStats: statsForPosition(position, seed),
			};
			const career: CareerSeason[] = [
				{
					season: 2023,
					league: team.league,
					teamId: team.id,
					teamName: summary.teamName,
					gamesPlayed: 14,
					stats: statsForPosition(position, seed - 5),
				},
				{
					season: 2024,
					league: team.league,
					teamId: team.id,
					teamName: summary.teamName,
					gamesPlayed: 16,
					stats: statsForPosition(position, seed - 2),
				},
				{
					season: 2025,
					league: team.league,
					teamId: team.id,
					teamName: summary.teamName,
					gamesPlayed: 12,
					stats: summary.keyStats,
				},
			];
			players.push({
				...summary,
				heightInches: rosterEntry.heightInches,
				weightPounds: rosterEntry.weightPounds,
				headshotUrl: headshot,
				bio:
					// UFL/CFL get sparse bios so the "graceful degradation" AC has
					// something to exercise.
					team.league === "UFL" || team.league === "CFL"
						? {
								dateOfBirth: null,
								birthplace: null,
								college: null,
								draftYear: null,
								draftRound: null,
								draftPick: null,
							}
						: {
								dateOfBirth: `199${seed % 9}-${String((seed % 12) + 1).padStart(2, "0")}-15`,
								birthplace: ["Dallas, TX", "Atlanta, GA", "Miami, FL", "Chicago, IL"][
									seed % 4
								] as string,
								college: ["Alabama", "Ohio State", "USC", "LSU"][seed % 4] as string,
								draftYear: 2018 + (seed % 7),
								draftRound: 1 + (seed % 7),
								draftPick: 1 + ((seed * 7) % 32),
							},
				career,
			});
			globalIndex++;
		}
	}
	return players;
})();

export const PLAYERS: PlayerSummary[] = ALL_PLAYERS.map((p) => {
	const {
		heightInches: _h,
		weightPounds: _w,
		headshotUrl: _hs,
		bio: _b,
		career: _c,
		...summary
	} = p;
	return summary;
});

export const PLAYER_DETAILS: Map<string, SeedPlayer> = new Map(ALL_PLAYERS.map((p) => [p.id, p]));

export function buildGameLogForPlayer(playerId: string, season: number): GameLogEntry[] {
	const player = PLAYER_DETAILS.get(playerId);
	if (!player) return [];
	const team = TEAMS.find((t) => t.id === player.teamId);
	if (!team) return [];
	const opponents = TEAMS.filter((t) => t.league === team.league && t.id !== team.id).slice(0, 6);
	const seasonOffset = (season - 2020) % 7;
	return opponents.map((opp, i) => ({
		gameId: `${player.id}-s${season}-w${i + 1}`,
		week: i + 1,
		date: new Date(season, 8, 7 + i * 7).toISOString(),
		opponentId: opp.id,
		opponentName: `${opp.location} ${opp.name}`,
		isHome: i % 2 === 0,
		stats: statsForPosition(player.position, i + seasonOffset),
	}));
}
