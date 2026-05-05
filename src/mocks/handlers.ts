import { http, HttpResponse } from "msw";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

export const handlers = [
	http.get(`${API_BASE}/api/teams/`, () => {
		return HttpResponse.json({
			count: 2,
			results: [
				{ id: "nfl-sea", name: "Seattle Seahawks", league: "NFL" },
				{ id: "nfl-sf", name: "San Francisco 49ers", league: "NFL" },
			],
		});
	}),
];
