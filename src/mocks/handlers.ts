import {
	GAMES,
	AVAILABLE_SEASONS as GAME_AVAILABLE_SEASONS,
	AVAILABLE_WEEKS as GAME_AVAILABLE_WEEKS,
	GAME_DETAILS,
	buildBoxScore,
	buildPlayByPlay,
	summarize as summarizeGame,
} from "@/features/games/fixtures";
import { GAME_STATUSES, type GameStatus } from "@/features/games/types";
import { PLAYERS, PLAYER_DETAILS, buildGameLogForPlayer } from "@/features/players/fixtures";
import { POSITIONS, type Position } from "@/features/players/types";
import { getAllPlays } from "@/features/stats/plays-source";
import { AVAILABLE_SEASONS, TEAMS, buildScheduleForTeam } from "@/features/teams/fixtures";
import type { League, TeamSummary } from "@/features/teams/types";
import { LEAGUES } from "@/features/teams/types";
import { http, HttpResponse } from "msw";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

function toSummary(team: (typeof TEAMS)[number]): TeamSummary {
	return {
		id: team.id,
		name: team.name,
		location: team.location,
		logoUrl: team.logoUrl,
		league: team.league,
		currentSeason: team.currentSeason,
		record: team.record,
	};
}

function isLeague(value: string | null): value is League {
	return value !== null && (LEAGUES as readonly string[]).includes(value);
}

export const handlers = [
	http.get(`${API_BASE}/api/teams/`, ({ request }) => {
		const url = new URL(request.url);
		const league = url.searchParams.get("league");
		const seasonParam = url.searchParams.get("season");
		const q = url.searchParams.get("q")?.trim().toLowerCase() ?? "";
		const page = Math.max(1, Number(url.searchParams.get("page") ?? "1"));
		const pageSize = Math.max(1, Number(url.searchParams.get("page_size") ?? "20"));

		let filtered = TEAMS.filter((team) => {
			if (isLeague(league) && team.league !== league) return false;
			if (seasonParam && team.currentSeason !== Number(seasonParam)) return false;
			if (q) {
				const haystack = `${team.location} ${team.name}`.toLowerCase();
				if (!haystack.includes(q)) return false;
			}
			return true;
		});

		// Stable alphabetical sort so pagination is deterministic.
		filtered = filtered
			.slice()
			.sort((a, b) => `${a.location} ${a.name}`.localeCompare(`${b.location} ${b.name}`));

		const start = (page - 1) * pageSize;
		const pageItems = filtered.slice(start, start + pageSize).map(toSummary);

		return HttpResponse.json({
			count: filtered.length,
			page,
			pageSize,
			results: pageItems,
			availableSeasons: AVAILABLE_SEASONS,
		});
	}),

	http.get(`${API_BASE}/api/teams/:teamId/`, ({ params }) => {
		const team = TEAMS.find((t) => t.id === params.teamId);
		if (!team) {
			return HttpResponse.json({ detail: "Not found." }, { status: 404 });
		}
		const { roster: _roster, stats: _stats, ...detail } = team;
		return HttpResponse.json(detail);
	}),

	http.get(`${API_BASE}/api/teams/:teamId/roster/`, ({ params }) => {
		const team = TEAMS.find((t) => t.id === params.teamId);
		if (!team) {
			return HttpResponse.json({ detail: "Not found." }, { status: 404 });
		}
		return HttpResponse.json(team.roster);
	}),

	http.get(`${API_BASE}/api/teams/:teamId/schedule/`, ({ params }) => {
		const team = TEAMS.find((t) => t.id === params.teamId);
		if (!team) {
			return HttpResponse.json({ detail: "Not found." }, { status: 404 });
		}
		return HttpResponse.json(buildScheduleForTeam(team.id));
	}),

	http.get(`${API_BASE}/api/teams/:teamId/stats/`, ({ params }) => {
		const team = TEAMS.find((t) => t.id === params.teamId);
		if (!team) {
			return HttpResponse.json({ detail: "Not found." }, { status: 404 });
		}
		return HttpResponse.json(team.stats);
	}),

	http.get(`${API_BASE}/api/players/`, ({ request }) => {
		const url = new URL(request.url);
		const q = url.searchParams.get("q")?.trim().toLowerCase() ?? "";
		const league = url.searchParams.get("league");
		const positionParam = url.searchParams.get("position");
		const teamIds = url.searchParams.getAll("team");
		const activeParam = url.searchParams.get("active");
		const page = Math.max(1, Number(url.searchParams.get("page") ?? "1"));
		const pageSize = Math.max(1, Number(url.searchParams.get("page_size") ?? "50"));

		const isPosition = (v: string | null): v is Position =>
			v !== null && (POSITIONS as readonly string[]).includes(v);

		let filtered = PLAYERS.filter((p) => {
			if (q && !p.name.toLowerCase().includes(q)) return false;
			if (isLeague(league) && p.league !== league) return false;
			if (isPosition(positionParam) && p.position !== positionParam) return false;
			if (teamIds.length > 0 && !teamIds.includes(p.teamId)) return false;
			if (activeParam !== null && activeParam !== "") {
				const wantActive = activeParam === "true";
				if (p.active !== wantActive) return false;
			}
			return true;
		});

		filtered = filtered.slice().sort((a, b) => a.name.localeCompare(b.name));

		const start = (page - 1) * pageSize;
		const pageItems = filtered.slice(start, start + pageSize);

		return HttpResponse.json({
			count: filtered.length,
			page,
			pageSize,
			results: pageItems,
		});
	}),

	http.get(`${API_BASE}/api/players/:playerId/`, ({ params }) => {
		const player = PLAYER_DETAILS.get(params.playerId as string);
		if (!player) {
			return HttpResponse.json({ detail: "Not found." }, { status: 404 });
		}
		const { career: _career, ...detail } = player;
		return HttpResponse.json(detail);
	}),

	http.get(`${API_BASE}/api/players/:playerId/career/`, ({ params }) => {
		const player = PLAYER_DETAILS.get(params.playerId as string);
		if (!player) {
			return HttpResponse.json({ detail: "Not found." }, { status: 404 });
		}
		return HttpResponse.json(player.career);
	}),

	http.get(`${API_BASE}/api/players/:playerId/game-log/`, ({ params, request }) => {
		const player = PLAYER_DETAILS.get(params.playerId as string);
		if (!player) {
			return HttpResponse.json({ detail: "Not found." }, { status: 404 });
		}
		const url = new URL(request.url);
		const season = Number(url.searchParams.get("season") ?? player.currentSeason);
		return HttpResponse.json(buildGameLogForPlayer(player.id, season));
	}),

	http.get(`${API_BASE}/api/games/`, ({ request }) => {
		const url = new URL(request.url);
		const league = url.searchParams.get("league");
		const seasonParam = url.searchParams.get("season");
		const weekParam = url.searchParams.get("week");
		const statusParam = url.searchParams.get("status");
		const teamIds = url.searchParams.getAll("team");
		const page = Math.max(1, Number(url.searchParams.get("page") ?? "1"));
		const pageSize = Math.max(1, Number(url.searchParams.get("page_size") ?? "25"));

		const isStatus = (v: string | null): v is GameStatus =>
			v !== null && (GAME_STATUSES as readonly string[]).includes(v);

		let filtered = GAMES.filter((g) => {
			if (isLeague(league) && g.league !== league) return false;
			if (seasonParam && g.season !== Number(seasonParam)) return false;
			if (weekParam && g.week !== Number(weekParam)) return false;
			if (isStatus(statusParam) && g.status !== statusParam) return false;
			if (
				teamIds.length > 0 &&
				!teamIds.includes(g.homeTeamId) &&
				!teamIds.includes(g.awayTeamId)
			) {
				return false;
			}
			return true;
		});

		// Default sort: date descending so the most recent games surface first.
		filtered = filtered.slice().sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));

		const start = (page - 1) * pageSize;
		const pageItems = filtered.slice(start, start + pageSize).map(summarizeGame);

		return HttpResponse.json({
			count: filtered.length,
			page,
			pageSize,
			results: pageItems,
			availableSeasons: GAME_AVAILABLE_SEASONS,
			availableWeeks: GAME_AVAILABLE_WEEKS,
		});
	}),

	http.get(`${API_BASE}/api/games/:gameId/`, ({ params }) => {
		const game = GAME_DETAILS.get(params.gameId as string);
		if (!game) {
			return HttpResponse.json({ detail: "Not found." }, { status: 404 });
		}
		return HttpResponse.json(game);
	}),

	http.get(`${API_BASE}/api/games/:gameId/box-score/`, ({ params }) => {
		const id = params.gameId as string;
		const game = GAME_DETAILS.get(id);
		if (!game) {
			return HttpResponse.json({ detail: "Not found." }, { status: 404 });
		}
		const box = buildBoxScore(id);
		if (!box) {
			// Scheduled games have no box score yet.
			return HttpResponse.json({ detail: "No box score available." }, { status: 409 });
		}
		return HttpResponse.json(box);
	}),

	http.get(`${API_BASE}/api/games/:gameId/play-by-play/`, ({ params }) => {
		const id = params.gameId as string;
		const game = GAME_DETAILS.get(id);
		if (!game) {
			return HttpResponse.json({ detail: "Not found." }, { status: 404 });
		}
		const pbp = buildPlayByPlay(id);
		if (!pbp) {
			return HttpResponse.json({ detail: "No play-by-play available." }, { status: 409 });
		}
		return HttpResponse.json(pbp);
	}),

	// Stats query — entity-dispatched, dataset-uniform handler. The real DRF
	// endpoint will replace this; the wire shape is intentionally minimal so
	// the swap is mostly s/MSW/real fetch.
	http.get(`${API_BASE}/api/stats/query/`, ({ request }) => {
		const url = new URL(request.url);
		const startedAt = (
			typeof performance !== "undefined" ? performance.now() : Date.now()
		) as number;
		const entity = url.searchParams.get("entity") ?? "plays";
		const sortId = url.searchParams.get("sort") ?? "";
		const dir = (url.searchParams.get("dir") ?? "desc") === "asc" ? "asc" : "desc";
		const page = Math.max(1, Number(url.searchParams.get("page") ?? "1"));
		const pageSize = Math.max(
			1,
			Math.min(5000, Number(url.searchParams.get("page_size") ?? "200")),
		);

		let rows: Record<string, unknown>[] = [];

		if (entity === "plays") {
			const leagueParam = url.searchParams.get("league");
			const seasonParam = url.searchParams.get("season");
			const teamParam = url.searchParams.get("team");
			const downs = url.searchParams.getAll("down");
			const results = url.searchParams.getAll("result");
			const yardsMin = url.searchParams.get("yards_min");
			const yardsMax = url.searchParams.get("yards_max");
			const scoring = url.searchParams.get("scoring") === "true";

			rows = getAllPlays().filter((p) => {
				if (leagueParam && p.league !== leagueParam) return false;
				if (seasonParam && p.season !== Number(seasonParam)) return false;
				if (teamParam && p.possessionTeamId !== teamParam) return false;
				if (downs.length > 0 && (p.down === null || !downs.includes(String(p.down)))) return false;
				if (results.length > 0 && !results.includes(p.result)) return false;
				if (yardsMin !== null && (p.yards === null || p.yards < Number(yardsMin))) return false;
				if (yardsMax !== null && (p.yards === null || p.yards > Number(yardsMax))) return false;
				if (scoring && !p.scoringPlay) return false;
				return true;
			});
		} else if (entity === "players") {
			const leagueParam = url.searchParams.get("league");
			const positions = url.searchParams.getAll("position");
			const active = url.searchParams.get("active") === "true";
			const q = url.searchParams.get("q")?.toLowerCase() ?? "";
			rows = PLAYERS.filter((p) => {
				if (leagueParam && p.league !== leagueParam) return false;
				if (positions.length > 0 && !positions.includes(p.position)) return false;
				if (active && !p.active) return false;
				if (q && !p.name.toLowerCase().includes(q)) return false;
				return true;
			}).map((p) => ({
				id: p.id,
				name: p.name,
				position: p.position,
				league: p.league,
				teamId: p.teamId,
				teamName: p.teamName,
				active: p.active,
				currentSeason: p.currentSeason,
				passYards: p.keyStats.passYards ?? null,
				passTds: p.keyStats.passTds ?? null,
				rushYards: p.keyStats.rushYards ?? null,
				rushTds: p.keyStats.rushTds ?? null,
				receptions: p.keyStats.receptions ?? null,
				recYards: p.keyStats.recYards ?? null,
				tackles: p.keyStats.tackles ?? null,
				sacks: p.keyStats.sacks ?? null,
			}));
		} else if (entity === "teams") {
			const leagueParam = url.searchParams.get("league");
			const seasonParam = url.searchParams.get("season");
			const q = url.searchParams.get("q")?.toLowerCase() ?? "";
			rows = TEAMS.filter((t) => {
				if (leagueParam && t.league !== leagueParam) return false;
				if (seasonParam && t.currentSeason !== Number(seasonParam)) return false;
				if (q && !`${t.location} ${t.name}`.toLowerCase().includes(q)) return false;
				return true;
			}).map((t) => ({
				id: t.id,
				displayName: `${t.location} ${t.name}`,
				league: t.league,
				wins: t.record.wins,
				losses: t.record.losses,
				ties: t.record.ties,
				currentSeason: t.currentSeason,
			}));
		} else if (entity === "games") {
			const leagueParam = url.searchParams.get("league");
			const seasonParam = url.searchParams.get("season");
			const weekParam = url.searchParams.get("week");
			const statuses = url.searchParams.getAll("status");
			const teamParam = url.searchParams.get("team");
			rows = GAMES.filter((g) => {
				if (leagueParam && g.league !== leagueParam) return false;
				if (seasonParam && g.season !== Number(seasonParam)) return false;
				if (weekParam && g.week !== Number(weekParam)) return false;
				if (statuses.length > 0 && !statuses.includes(g.status)) return false;
				if (teamParam && g.homeTeamId !== teamParam && g.awayTeamId !== teamParam) return false;
				return true;
			}).map((g) => ({
				id: g.id,
				date: g.date,
				league: g.league,
				week: g.week,
				matchup: `${g.awayTeamName} @ ${g.homeTeamName}`,
				score:
					g.awayScore === null || g.homeScore === null ? null : `${g.awayScore} – ${g.homeScore}`,
				status: g.status,
			}));
		}

		// Generic comparator using the requested sort key. Strings sort
		// case-insensitively; numbers numerically; nulls go last.
		if (sortId) {
			const sign = dir === "asc" ? 1 : -1;
			rows = rows.slice().sort((a, b) => {
				const av = a[sortId];
				const bv = b[sortId];
				if (av === bv) return 0;
				if (av === null || av === undefined) return 1;
				if (bv === null || bv === undefined) return -1;
				if (typeof av === "number" && typeof bv === "number") return (av - bv) * sign;
				return String(av).localeCompare(String(bv)) * sign;
			});
		}

		const count = rows.length;
		const start = (page - 1) * pageSize;
		const pageItems = rows.slice(start, start + pageSize);
		const queryMs = Math.round(
			((typeof performance !== "undefined" ? performance.now() : Date.now()) as number) - startedAt,
		);

		return HttpResponse.json({
			entity,
			count,
			page,
			pageSize,
			results: pageItems,
			queryMs,
		});
	}),
];
