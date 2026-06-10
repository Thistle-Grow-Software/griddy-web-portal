import { renderWithProviders, screen, userEvent } from "@/test-utils";
import { act, fireEvent } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GameFilmPlayer } from "./GameFilmPlayer";

// Capture the fatal-error handler the component registers so tests can drive
// hls.js failure paths without a real MediaSource.
let hlsErrorHandler: ((event: unknown, data: unknown) => void) | null = null;
const hlsInstance = {
	loadSource: vi.fn(),
	attachMedia: vi.fn(),
	on: vi.fn((event: string, cb: (e: unknown, d: unknown) => void) => {
		if (event === "hlsError") hlsErrorHandler = cb;
	}),
	destroy: vi.fn(),
};

vi.mock("hls.js", () => {
	// biome-ignore lint/suspicious/noExplicitAny: minimal test double for the hls.js class
	const Hls: any = vi.fn(() => hlsInstance);
	Hls.isSupported = () => true;
	Hls.Events = { ERROR: "hlsError" };
	Hls.ErrorTypes = {
		NETWORK_ERROR: "networkError",
		MEDIA_ERROR: "mediaError",
		OTHER_ERROR: "otherError",
	};
	return { default: Hls };
});

function getVideo(): HTMLVideoElement {
	return screen.getByTestId("film-video") as HTMLVideoElement;
}

// Give the media element a usable timeline — happy-dom reports duration 0.
function setDuration(video: HTMLVideoElement, seconds: number) {
	Object.defineProperty(video, "duration", { configurable: true, get: () => seconds });
}

describe("<GameFilmPlayer />", () => {
	beforeEach(() => {
		hlsErrorHandler = null;
		localStorage.clear();
		vi.spyOn(window.HTMLMediaElement.prototype, "play").mockResolvedValue(undefined);
		vi.spyOn(window.HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
		vi.spyOn(window.HTMLMediaElement.prototype, "load").mockImplementation(() => {});
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("renders the control bar and a 1× speed by default", () => {
		renderWithProviders(<GameFilmPlayer src="/film/sample.m3u8" title="Game film" />);
		expect(screen.getByTestId("film-controls")).toBeInTheDocument();
		expect(screen.getByLabelText("Play")).toBeInTheDocument();
		expect(screen.getByTestId("film-scrubber")).toBeInTheDocument();
		expect(screen.getByTestId("film-rate")).toHaveTextContent("1×");
	});

	it("loads the manifest through hls.js when supported", () => {
		renderWithProviders(<GameFilmPlayer src="/film/sample.m3u8" title="Game film" />);
		expect(hlsInstance.loadSource).toHaveBeenCalledWith("/film/sample.m3u8");
		expect(hlsInstance.attachMedia).toHaveBeenCalled();
	});

	it("space toggles playback", () => {
		renderWithProviders(<GameFilmPlayer src="/film/sample.m3u8" title="Game film" />);
		const playSpy = window.HTMLMediaElement.prototype.play as ReturnType<typeof vi.fn>;
		fireEvent.keyDown(screen.getByTestId("film-player"), { key: " " });
		expect(playSpy).toHaveBeenCalled();
	});

	it("J / L seek backward and forward by 10s", () => {
		renderWithProviders(<GameFilmPlayer src="/film/sample.m3u8" title="Game film" />);
		const video = getVideo();
		setDuration(video, 100);
		video.currentTime = 20;

		fireEvent.keyDown(screen.getByTestId("film-player"), { key: "l" });
		expect(video.currentTime).toBe(30);
		fireEvent.keyDown(screen.getByTestId("film-player"), { key: "j" });
		expect(video.currentTime).toBe(20);
	});

	it("M toggles mute", () => {
		renderWithProviders(<GameFilmPlayer src="/film/sample.m3u8" title="Game film" />);
		const video = getVideo();
		expect(video.muted).toBe(false);
		fireEvent.keyDown(screen.getByTestId("film-player"), { key: "m" });
		expect(video.muted).toBe(true);
	});

	it("changing playback rate does not reset position", async () => {
		const user = userEvent.setup();
		renderWithProviders(<GameFilmPlayer src="/film/sample.m3u8" title="Game film" />);
		const video = getVideo();
		setDuration(video, 100);
		video.currentTime = 42;

		await user.click(screen.getByTestId("film-rate"));
		await user.click(await screen.findByTestId("film-rate-1.5"));

		expect(video.playbackRate).toBe(1.5);
		expect(video.currentTime).toBe(42); // position preserved (acceptance criterion)
		expect(screen.getByTestId("film-rate")).toHaveTextContent("1.5×");
	});

	it("resumes from the saved position on load", () => {
		const key = "griddy:film-pos:u1:g1";
		localStorage.setItem(key, "30");
		renderWithProviders(
			<GameFilmPlayer src="/film/sample.m3u8" title="Game film" storageKey={key} />,
		);
		const video = getVideo();
		setDuration(video, 100);
		fireEvent.loadedMetadata(video);
		expect(video.currentTime).toBe(30);
	});

	it("does not resume when the saved position is within the end guard", () => {
		const key = "griddy:film-pos:u1:g1";
		localStorage.setItem(key, "96"); // < 10s from a 100s end → restart instead
		renderWithProviders(
			<GameFilmPlayer src="/film/sample.m3u8" title="Game film" storageKey={key} />,
		);
		const video = getVideo();
		setDuration(video, 100);
		fireEvent.loadedMetadata(video);
		expect(video.currentTime).toBe(0);
	});

	it("shows an informative error overlay and emits an error event on fatal hls failure", () => {
		const onEvent = vi.fn();
		renderWithProviders(
			<GameFilmPlayer src="/film/sample.m3u8" title="Game film" onEvent={onEvent} />,
		);
		expect(hlsErrorHandler).toBeTypeOf("function");
		act(() => hlsErrorHandler?.(null, { fatal: true, type: "networkError" }));

		const overlay = screen.getByTestId("film-error");
		expect(overlay).toBeInTheDocument();
		expect(overlay).toHaveTextContent(/couldn't load the film/i);
		expect(onEvent).toHaveBeenCalledWith(
			expect.objectContaining({ type: "playback_error", fatal: true }),
		);
	});

	it("ignores non-fatal hls errors", () => {
		renderWithProviders(<GameFilmPlayer src="/film/sample.m3u8" title="Game film" />);
		act(() => hlsErrorHandler?.(null, { fatal: false, type: "networkError" }));
		expect(screen.queryByTestId("film-error")).not.toBeInTheDocument();
	});

	it("emits started then completed across the playback lifecycle", () => {
		const onEvent = vi.fn();
		renderWithProviders(
			<GameFilmPlayer src="/film/sample.m3u8" title="Game film" onEvent={onEvent} />,
		);
		const video = getVideo();
		fireEvent.play(video);
		fireEvent.ended(video);
		expect(onEvent).toHaveBeenCalledWith({ type: "playback_started" });
		expect(onEvent).toHaveBeenCalledWith({ type: "playback_completed" });
	});

	it("lists keyboard shortcuts in the help popover", async () => {
		const user = userEvent.setup();
		renderWithProviders(<GameFilmPlayer src="/film/sample.m3u8" title="Game film" />);
		await user.click(screen.getByTestId("film-help"));
		expect(await screen.findByText("Keyboard shortcuts")).toBeInTheDocument();
		expect(screen.getByText("Back 10s")).toBeInTheDocument();
		expect(screen.getByText("Fullscreen")).toBeInTheDocument();
	});
});
