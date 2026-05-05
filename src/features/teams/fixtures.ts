import type { League, RosterPlayer, ScheduleGame, Season, SeasonStats, TeamDetail } from "./types";

// Hand-curated seed data sized for development and tests. Not exhaustive —
// real production data comes from the Griddy API once the schema lands.
// NCAA gets the largest count (a representative slice, not all 130+) to
// exercise pagination paths in the browse view.

type SeedTeam = TeamDetail & {
	roster: RosterPlayer[];
	stats: SeasonStats;
};

function makeRoster(prefix: string): RosterPlayer[] {
	const positions = ["QB", "RB", "WR", "TE", "OL", "DL", "LB", "CB", "S", "K"] as const;
	return positions.map((position, index) => ({
		id: `${prefix}-p${index + 1}`,
		name: `${prefix.toUpperCase()} Player ${index + 1}`,
		position,
		jersey: index + 1,
		heightInches: 70 + (index % 8),
		weightPounds: 195 + (index % 6) * 10,
	}));
}

function makeStats(seed: number): SeasonStats {
	return {
		gamesPlayed: 14,
		pointsFor: 320 + (seed % 80),
		pointsAgainst: 280 + (seed % 60),
		totalYards: 4800 + (seed % 600),
		passingYards: 3000 + (seed % 400),
		rushingYards: 1700 + (seed % 300),
		turnovers: 12 + (seed % 7),
	};
}

function makeTeam(args: {
	id: string;
	name: string;
	location: string;
	league: League;
	currentSeason: Season;
	conference?: string | null;
	division?: string | null;
	venue?: string | null;
	wins: number;
	losses: number;
	ties?: number;
	seed: number;
}): SeedTeam {
	return {
		id: args.id,
		name: args.name,
		location: args.location,
		logoUrl: null,
		league: args.league,
		currentSeason: args.currentSeason,
		record: { wins: args.wins, losses: args.losses, ties: args.ties ?? 0 },
		conference: args.conference ?? null,
		division: args.division ?? null,
		venue: args.venue ?? null,
		roster: makeRoster(args.id),
		stats: makeStats(args.seed),
	};
}

export const TEAMS: SeedTeam[] = [
	// NFL
	makeTeam({
		id: "nfl-kc",
		name: "Chiefs",
		location: "Kansas City",
		league: "NFL",
		currentSeason: 2025,
		conference: "AFC",
		division: "West",
		venue: "Arrowhead Stadium",
		wins: 11,
		losses: 3,
		seed: 11,
	}),
	makeTeam({
		id: "nfl-sf",
		name: "49ers",
		location: "San Francisco",
		league: "NFL",
		currentSeason: 2025,
		conference: "NFC",
		division: "West",
		venue: "Levi's Stadium",
		wins: 9,
		losses: 5,
		seed: 9,
	}),
	makeTeam({
		id: "nfl-buf",
		name: "Bills",
		location: "Buffalo",
		league: "NFL",
		currentSeason: 2025,
		conference: "AFC",
		division: "East",
		venue: "Highmark Stadium",
		wins: 10,
		losses: 4,
		seed: 10,
	}),
	makeTeam({
		id: "nfl-det",
		name: "Lions",
		location: "Detroit",
		league: "NFL",
		currentSeason: 2025,
		conference: "NFC",
		division: "North",
		venue: "Ford Field",
		wins: 12,
		losses: 2,
		seed: 12,
	}),
	makeTeam({
		id: "nfl-sea",
		name: "Seahawks",
		location: "Seattle",
		league: "NFL",
		currentSeason: 2025,
		conference: "NFC",
		division: "West",
		venue: "Lumen Field",
		wins: 8,
		losses: 6,
		seed: 8,
	}),

	// NCAA — representative subset
	...["Alabama", "Georgia", "Michigan", "Ohio State", "Oregon", "Texas", "Notre Dame"].map(
		(name, idx) =>
			makeTeam({
				id: `ncaa-${name.toLowerCase().replace(/\s+/g, "-")}`,
				name,
				location: name,
				league: "NCAA",
				currentSeason: 2025,
				conference: idx % 2 === 0 ? "SEC" : "Big Ten",
				division: null,
				venue: null,
				wins: 9 - (idx % 3),
				losses: 2 + (idx % 3),
				seed: 20 + idx,
			}),
	),
	// More NCAA to exceed page size and exercise pagination.
	...Array.from({ length: 18 }, (_, i) =>
		makeTeam({
			id: `ncaa-team-${i + 8}`,
			name: `College Team ${i + 8}`,
			location: `City ${i + 8}`,
			league: "NCAA",
			currentSeason: 2025,
			conference: ["Big 12", "ACC", "Pac-12"][i % 3] as string,
			wins: 6 + (i % 4),
			losses: 4 + (i % 3),
			seed: 50 + i,
		}),
	),

	// UFL
	makeTeam({
		id: "ufl-bham",
		name: "Stallions",
		location: "Birmingham",
		league: "UFL",
		currentSeason: 2025,
		wins: 8,
		losses: 2,
		seed: 30,
	}),
	makeTeam({
		id: "ufl-stl",
		name: "Battlehawks",
		location: "St. Louis",
		league: "UFL",
		currentSeason: 2025,
		wins: 7,
		losses: 3,
		seed: 31,
	}),

	// CFL
	makeTeam({
		id: "cfl-tor",
		name: "Argonauts",
		location: "Toronto",
		league: "CFL",
		currentSeason: 2025,
		wins: 11,
		losses: 7,
		ties: 0,
		seed: 40,
	}),
	makeTeam({
		id: "cfl-wpg",
		name: "Blue Bombers",
		location: "Winnipeg",
		league: "CFL",
		currentSeason: 2025,
		wins: 13,
		losses: 5,
		seed: 41,
	}),
];

export const AVAILABLE_SEASONS: Record<League, Season[]> = {
	NFL: [2025, 2024, 2023],
	NCAA: [2025, 2024],
	UFL: [2025, 2024],
	CFL: [2025, 2024],
};

// Schedule generation — every team gets 4 fixtures against league-mates.
export function buildScheduleForTeam(teamId: string): ScheduleGame[] {
	const team = TEAMS.find((t) => t.id === teamId);
	if (!team) return [];
	const opponents = TEAMS.filter((t) => t.league === team.league && t.id !== team.id).slice(0, 4);
	return opponents.map((opp, i) => {
		const final = i < 2;
		const isHome = i % 2 === 0;
		return {
			id: `${teamId}-vs-${opp.id}`,
			week: i + 1,
			date: new Date(2025, 8, 7 + i * 7).toISOString(),
			opponentId: opp.id,
			opponentName: `${opp.location} ${opp.name}`,
			isHome,
			status: final ? "final" : i === 2 ? "in_progress" : "scheduled",
			teamScore: final ? 24 + i * 3 : null,
			opponentScore: final ? 17 + i * 2 : null,
		};
	});
}
