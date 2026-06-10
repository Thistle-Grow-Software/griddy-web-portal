import { renderWithProviders, screen, userEvent } from "@/test-utils";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { GamePlayback } from "../types";
import { FilmTab } from "./FilmTab";

vi.mock("@clerk/react", () => ({
	useAuth: () => ({ userId: "user_123" }),
}));

const trackMock = vi.fn();
vi.mock("@/observability/analytics", () => ({
	track: (event: string, props?: unknown) => trackMock(event, props),
}));

// Replace the real player with a stub that surfaces the props we care about
// and lets us drive its `onEvent` callback.
vi.mock("./GameFilmPlayer", () => ({
	GameFilmPlayer: (props: {
		src: string;
		storageKey?: string;
		onEvent?: (e: { type: string; message?: string; fatal?: boolean }) => void;
	}) => (
		<div data-testid="player-stub" data-src={props.src} data-storage-key={props.storageKey}>
			<button type="button" onClick={() => props.onEvent?.({ type: "playback_started" })}>
				start
			</button>
			<button
				type="button"
				onClick={() => props.onEvent?.({ type: "playback_error", message: "boom", fatal: true })}
			>
				error
			</button>
		</div>
	),
}));

const useGamePlaybackMock = vi.fn();
vi.mock("../hooks", () => ({
	useGamePlayback: (gameId: string, active?: boolean) => useGamePlaybackMock(gameId, active),
}));

const PLAYBACK: GamePlayback = {
	manifestUrl: "/sample/film/sample.m3u8",
	token: "dev-token-g1",
	expiresAt: "2099-01-01T00:00:00.000Z",
	poster: "/sample/film/poster.jpg",
};

afterEach(() => {
	vi.clearAllMocks();
});

describe("<FilmTab />", () => {
	it("shows a skeleton while the manifest URL resolves", () => {
		useGamePlaybackMock.mockReturnValue({ isLoading: true, isError: false });
		renderWithProviders(<FilmTab gameId="g1" active />);
		expect(screen.getByTestId("film-skeleton")).toBeInTheDocument();
	});

	it("shows the empty state when the game predates the catalog (404)", () => {
		useGamePlaybackMock.mockReturnValue({
			isLoading: false,
			isError: true,
			error: { status: 404 },
		});
		renderWithProviders(<FilmTab gameId="g1" active />);
		expect(screen.getByText(/no film available for this game/i)).toBeInTheDocument();
	});

	it("shows an alert on a non-404 failure", () => {
		useGamePlaybackMock.mockReturnValue({
			isLoading: false,
			isError: true,
			error: Object.assign(new Error("server exploded"), { status: 500 }),
		});
		renderWithProviders(<FilmTab gameId="g1" active />);
		expect(screen.getByText(/couldn't load film/i)).toBeInTheDocument();
		expect(screen.getByText(/server exploded/i)).toBeInTheDocument();
	});

	it("renders the player with a user+game-scoped resume key on success", () => {
		useGamePlaybackMock.mockReturnValue({ isLoading: false, isError: false, data: PLAYBACK });
		renderWithProviders(<FilmTab gameId="g1" active />);
		const stub = screen.getByTestId("player-stub");
		expect(stub).toHaveAttribute("data-src", "/sample/film/sample.m3u8");
		expect(stub).toHaveAttribute("data-storage-key", "griddy:film-pos:user_123:g1");
	});

	it("forwards player events to analytics", async () => {
		const user = userEvent.setup();
		useGamePlaybackMock.mockReturnValue({ isLoading: false, isError: false, data: PLAYBACK });
		renderWithProviders(<FilmTab gameId="g1" active />);

		await user.click(screen.getByText("start"));
		expect(trackMock).toHaveBeenCalledWith("video.playback_started", { gameId: "g1" });

		await user.click(screen.getByText("error"));
		expect(trackMock).toHaveBeenCalledWith(
			"video.playback_error",
			expect.objectContaining({ gameId: "g1", fatal: true }),
		);
	});
});
