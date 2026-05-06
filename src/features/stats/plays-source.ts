import { GAMES, buildPlayByPlay } from "@/features/games/fixtures";

/**
 * Flat row representation of a single play, with enough game context
 * inlined that the stats UI doesn't need a join. Built lazily the first
 * time `getAllPlays()` is called — generating PBP for every game upfront
 * would slow module load.
 */
export type FlatPlay = {
	playId: string;
	gameId: string;
	gameLabel: string;
	league: string;
	season: number;
	week: number;
	quarter: number;
	gameClock: string;
	possessionTeamId: string;
	possessionTeamName: string;
	down: number | null;
	distance: number | null;
	yardLine: string;
	description: string;
	yards: number | null;
	result: string;
	scoringPlay: boolean;
};

let cachedPlays: FlatPlay[] | null = null;

export function getAllPlays(): FlatPlay[] {
	if (cachedPlays) return cachedPlays;
	const out: FlatPlay[] = [];
	for (const game of GAMES) {
		const pbp = buildPlayByPlay(game.id);
		if (!pbp) continue;
		const gameLabel = `${game.awayTeamName} @ ${game.homeTeamName}`;
		for (const drive of pbp.drives) {
			for (const play of drive.plays) {
				out.push({
					playId: play.id,
					gameId: game.id,
					gameLabel,
					league: game.league,
					season: game.season,
					week: game.week,
					quarter: play.quarter,
					gameClock: play.gameClock,
					possessionTeamId: play.possessionTeamId,
					possessionTeamName: drive.possessionTeamName,
					down: play.down,
					distance: play.distance,
					yardLine: play.yardLine,
					description: play.description,
					yards: play.yards,
					result: play.result,
					scoringPlay: play.scoringPlay,
				});
			}
		}
	}
	cachedPlays = out;
	return out;
}

/** Reset cache — only used by tests that mutate fixtures. */
export function _resetPlaysCache(): void {
	cachedPlays = null;
}
