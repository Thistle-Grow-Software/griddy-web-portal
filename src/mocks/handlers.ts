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
];
