import { ActionIcon, Group, Menu, Popover, Slider, Stack, Text, Tooltip } from "@mantine/core";
import {
	IconAlertTriangle,
	IconKeyboard,
	IconMaximize,
	IconPlayerPause,
	IconPlayerPlay,
	IconReload,
	IconVolume,
	IconVolumeOff,
} from "@tabler/icons-react";
import Hls from "hls.js";
import { useCallback, useEffect, useRef, useState } from "react";

// Reusable HLS-capable film player (TGF-335). Built on a native <video> +
// hls.js rather than a heavyweight player kit: ADR-0008 explicitly authorizes
// this swap (no new ADR needed), it is React-19 clean, and it gives us full
// control over the film-review controls (rate selector, custom keymap, resume)
// while staying unit-testable in happy-dom. The delivery design — HLS from R2
// behind a Worker, with credentialed segment fetches — is unchanged: callers
// pass a manifest URL and we attach `crossOrigin="use-credentials"` so the
// Worker's signed cookie rides every segment request.

export type FilmPlayerEvent =
	| { type: "playback_started" }
	| { type: "playback_progress"; position: number; duration: number }
	| { type: "playback_completed" }
	| { type: "playback_error"; message: string; fatal: boolean };

export type GameFilmPlayerProps = {
	/** HLS manifest URL (`.m3u8`). A direct MP4/native source also works. */
	src: string;
	/** Optional poster shown before playback begins. */
	poster?: string;
	/** Accessible label for the video element. */
	title: string;
	/** Structured playback events — wire these to analytics at the call site. */
	onEvent?: (event: FilmPlayerEvent) => void;
	/**
	 * When set, the last position is persisted to localStorage under this key
	 * and restored on load. Omit to disable resume (compose it per user+game at
	 * the call site so positions don't leak across users sharing a browser).
	 */
	storageKey?: string;
};

const PLAYBACK_RATES = [0.25, 0.5, 1, 1.5, 2] as const;
// Don't resume within this many seconds of the end — a near-complete watch
// should restart, not drop the viewer onto the final frame.
const RESUME_TAIL_GUARD = 10;
// Throttle localStorage writes and progress events; timeupdate fires ~4×/s.
const SAVE_INTERVAL = 5;
const PROGRESS_INTERVAL = 15;

const SHORTCUTS: ReadonlyArray<{ keys: string; action: string }> = [
	{ keys: "Space / K", action: "Play / pause" },
	{ keys: "J", action: "Back 10s" },
	{ keys: "L", action: "Forward 10s" },
	{ keys: "M", action: "Mute / unmute" },
	{ keys: "F", action: "Fullscreen" },
];

function isHlsManifest(src: string): boolean {
	return /\.m3u8(\?|$)/i.test(src);
}

function formatTime(seconds: number): string {
	if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
	const total = Math.floor(seconds);
	const m = Math.floor(total / 60);
	const s = total % 60;
	return `${m}:${String(s).padStart(2, "0")}`;
}

// Keyboard shortcuts should fire when the player has focus, but must not steal
// keys from the controls themselves (a focused slider/button/menu).
function isInteractiveTarget(target: EventTarget | null): boolean {
	if (!(target instanceof HTMLElement)) return false;
	return Boolean(target.closest('button, input, [role="slider"], [role="menuitem"]'));
}

export function GameFilmPlayer({ src, poster, title, onEvent, storageKey }: GameFilmPlayerProps) {
	const videoRef = useRef<HTMLVideoElement>(null);
	const containerRef = useRef<HTMLDivElement>(null);

	const [isPlaying, setIsPlaying] = useState(false);
	const [currentTime, setCurrentTime] = useState(0);
	const [duration, setDuration] = useState(0);
	const [volume, setVolume] = useState(1);
	const [muted, setMuted] = useState(false);
	const [rate, setRate] = useState(1);
	const [isFullscreen, setIsFullscreen] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Latest-value refs so the long-lived media/keyboard listeners don't need to
	// be torn down and rebuilt on every state change.
	const onEventRef = useRef(onEvent);
	onEventRef.current = onEvent;
	const storageKeyRef = useRef(storageKey);
	storageKeyRef.current = storageKey;
	const startedRef = useRef(false);
	const lastSavedRef = useRef(0);
	const lastProgressRef = useRef(0);

	const emit = useCallback((event: FilmPlayerEvent) => {
		onEventRef.current?.(event);
	}, []);

	const persistPosition = useCallback((time: number) => {
		const key = storageKeyRef.current;
		if (!key) return;
		try {
			localStorage.setItem(key, String(Math.floor(time)));
		} catch {
			// Private mode / quota — resume is best-effort, never fatal.
		}
	}, []);

	// --- Source attachment (hls.js, native HLS, or direct) -------------------
	// Keyed on `src` only: re-running on every prop change would tear down an
	// active stream mid-playback.
	useEffect(() => {
		const video = videoRef.current;
		if (!video) return;
		setError(null);
		startedRef.current = false;

		let hls: Hls | null = null;

		if (isHlsManifest(src) && Hls.isSupported()) {
			hls = new Hls({ enableWorker: true });
			hls.loadSource(src);
			hls.attachMedia(video);
			hls.on(Hls.Events.ERROR, (_event, data) => {
				if (!data.fatal) return;
				const message =
					data.type === Hls.ErrorTypes.NETWORK_ERROR
						? "Couldn't load the film — the stream may be unavailable or your connection dropped."
						: data.type === Hls.ErrorTypes.MEDIA_ERROR
							? "This film can't be decoded in your browser (unsupported codec)."
							: "Playback failed unexpectedly.";
				setError(message);
				emit({ type: "playback_error", message, fatal: true });
			});
		} else if (video.canPlayType("application/vnd.apple.mpegurl") || !isHlsManifest(src)) {
			// Native HLS (Safari) or a directly playable source (e.g. MP4).
			video.src = src;
		} else {
			const message = "Your browser can't play HLS video and the fallback player failed to load.";
			setError(message);
			emit({ type: "playback_error", message, fatal: true });
		}

		return () => {
			hls?.destroy();
		};
	}, [src, emit]);

	// --- Media element event wiring -----------------------------------------
	useEffect(() => {
		const video = videoRef.current;
		if (!video) return;

		const onLoadedMetadata = () => {
			setDuration(video.duration);
			const key = storageKeyRef.current;
			if (!key) return;
			const saved = Number(localStorage.getItem(key));
			if (Number.isFinite(saved) && saved > 0 && saved < video.duration - RESUME_TAIL_GUARD) {
				video.currentTime = saved;
			}
		};
		const onTimeUpdate = () => {
			const t = video.currentTime;
			setCurrentTime(t);
			if (Math.abs(t - lastSavedRef.current) >= SAVE_INTERVAL) {
				lastSavedRef.current = t;
				persistPosition(t);
			}
			if (Math.abs(t - lastProgressRef.current) >= PROGRESS_INTERVAL) {
				lastProgressRef.current = t;
				emit({ type: "playback_progress", position: t, duration: video.duration });
			}
		};
		const onPlay = () => {
			setIsPlaying(true);
			if (!startedRef.current) {
				startedRef.current = true;
				emit({ type: "playback_started" });
			}
		};
		const onPause = () => {
			setIsPlaying(false);
			persistPosition(video.currentTime);
		};
		const onEnded = () => {
			setIsPlaying(false);
			// A finished watch shouldn't resume next time.
			const key = storageKeyRef.current;
			if (key) localStorage.removeItem(key);
			emit({ type: "playback_completed" });
		};
		const onVolumeChange = () => {
			setVolume(video.volume);
			setMuted(video.muted);
		};

		video.addEventListener("loadedmetadata", onLoadedMetadata);
		video.addEventListener("timeupdate", onTimeUpdate);
		video.addEventListener("play", onPlay);
		video.addEventListener("pause", onPause);
		video.addEventListener("ended", onEnded);
		video.addEventListener("volumechange", onVolumeChange);

		return () => {
			video.removeEventListener("loadedmetadata", onLoadedMetadata);
			video.removeEventListener("timeupdate", onTimeUpdate);
			video.removeEventListener("play", onPlay);
			video.removeEventListener("pause", onPause);
			video.removeEventListener("ended", onEnded);
			video.removeEventListener("volumechange", onVolumeChange);
			// Best-effort save on unmount so navigation away preserves position.
			persistPosition(video.currentTime);
		};
	}, [emit, persistPosition]);

	// --- Fullscreen state sync ----------------------------------------------
	useEffect(() => {
		const onChange = () => setIsFullscreen(document.fullscreenElement === containerRef.current);
		document.addEventListener("fullscreenchange", onChange);
		return () => document.removeEventListener("fullscreenchange", onChange);
	}, []);

	const togglePlay = useCallback(() => {
		const video = videoRef.current;
		if (!video) return;
		if (video.paused) {
			void video.play().catch(() => {
				/* autoplay/user-gesture rejections are non-fatal */
			});
		} else {
			video.pause();
		}
	}, []);

	const seekBy = useCallback((delta: number) => {
		const video = videoRef.current;
		if (!video) return;
		const next = Math.min(Math.max(video.currentTime + delta, 0), video.duration || 0);
		video.currentTime = next;
		setCurrentTime(next);
	}, []);

	const seekTo = useCallback((time: number) => {
		const video = videoRef.current;
		if (!video) return;
		video.currentTime = time;
		setCurrentTime(time);
	}, []);

	const toggleMute = useCallback(() => {
		const video = videoRef.current;
		if (!video) return;
		video.muted = !video.muted;
	}, []);

	const changeVolume = useCallback((value: number) => {
		const video = videoRef.current;
		if (!video) return;
		video.volume = value;
		if (value > 0 && video.muted) video.muted = false;
	}, []);

	// Changing the rate only sets a property — it never reseeks, so position is
	// preserved (acceptance criterion).
	const changeRate = useCallback((value: number) => {
		const video = videoRef.current;
		if (!video) return;
		video.playbackRate = value;
		setRate(value);
	}, []);

	const toggleFullscreen = useCallback(() => {
		const container = containerRef.current;
		if (!container) return;
		if (document.fullscreenElement === container) {
			void document.exitFullscreen?.();
		} else {
			void container.requestFullscreen?.();
		}
	}, []);

	const onKeyDown = useCallback(
		(event: React.KeyboardEvent<HTMLDivElement>) => {
			if (isInteractiveTarget(event.target)) return;
			switch (event.key.toLowerCase()) {
				case " ":
				case "k":
					event.preventDefault();
					togglePlay();
					break;
				case "j":
					event.preventDefault();
					seekBy(-10);
					break;
				case "l":
					event.preventDefault();
					seekBy(10);
					break;
				case "m":
					event.preventDefault();
					toggleMute();
					break;
				case "f":
					event.preventDefault();
					toggleFullscreen();
					break;
				default:
					break;
			}
		},
		[togglePlay, seekBy, toggleMute, toggleFullscreen],
	);

	return (
		<div
			ref={containerRef}
			data-testid="film-player"
			aria-label={`${title} player`}
			// biome-ignore lint/a11y/noNoninteractiveTabindex: focusable media region so keyboard shortcuts (space/J/K/L/F/M) work
			tabIndex={0}
			onKeyDown={onKeyDown}
			style={{
				position: "relative",
				background: "#000",
				borderRadius: 8,
				overflow: "hidden",
				outline: "none",
			}}
		>
			{/* biome-ignore lint/a11y/useMediaCaption: game film has no caption track in v1 */}
			<video
				ref={videoRef}
				poster={poster}
				title={title}
				aria-label={title}
				crossOrigin="use-credentials"
				playsInline
				style={{ display: "block", width: "100%", maxHeight: "70vh", background: "#000" }}
				data-testid="film-video"
			/>

			{error ? (
				<Stack
					align="center"
					justify="center"
					gap="sm"
					data-testid="film-error"
					style={{
						position: "absolute",
						inset: 0,
						background: "rgba(0,0,0,0.82)",
						color: "var(--mantine-color-gray-0)",
						padding: 24,
						textAlign: "center",
					}}
				>
					<IconAlertTriangle size={40} color="var(--mantine-color-yellow-5)" />
					<Text fw={600}>Can't play this film</Text>
					<Text size="sm" c="gray.4" maw={420}>
						{error}
					</Text>
					<ActionIcon
						variant="light"
						color="gray"
						size="lg"
						aria-label="Retry playback"
						onClick={() => {
							const video = videoRef.current;
							setError(null);
							if (video) {
								video.load();
								void video.play().catch(() => {});
							}
						}}
					>
						<IconReload size={18} />
					</ActionIcon>
				</Stack>
			) : null}

			<Group
				gap="sm"
				wrap="nowrap"
				px="sm"
				py="xs"
				data-testid="film-controls"
				style={{ background: "var(--mantine-color-dark-7)", color: "var(--mantine-color-gray-0)" }}
			>
				<Tooltip label={isPlaying ? "Pause (k)" : "Play (k)"} withinPortal>
					<ActionIcon
						variant="subtle"
						color="gray"
						aria-label={isPlaying ? "Pause" : "Play"}
						onClick={togglePlay}
						data-testid="film-playpause"
					>
						{isPlaying ? <IconPlayerPause size={18} /> : <IconPlayerPlay size={18} />}
					</ActionIcon>
				</Tooltip>

				<Text
					size="xs"
					c="gray.4"
					w={84}
					ta="center"
					style={{ fontVariantNumeric: "tabular-nums" }}
				>
					{formatTime(currentTime)} / {formatTime(duration)}
				</Text>

				<Slider
					flex={1}
					size="sm"
					label={formatTime(currentTime)}
					min={0}
					max={duration || 0}
					step={0.1}
					value={Math.min(currentTime, duration || 0)}
					onChange={seekTo}
					aria-label="Seek"
					data-testid="film-scrubber"
				/>

				<Tooltip label={muted ? "Unmute (m)" : "Mute (m)"} withinPortal>
					<ActionIcon
						variant="subtle"
						color="gray"
						aria-label={muted ? "Unmute" : "Mute"}
						onClick={toggleMute}
						data-testid="film-mute"
					>
						{muted || volume === 0 ? <IconVolumeOff size={18} /> : <IconVolume size={18} />}
					</ActionIcon>
				</Tooltip>
				<Slider
					w={80}
					size="sm"
					min={0}
					max={1}
					step={0.05}
					value={muted ? 0 : volume}
					onChange={changeVolume}
					aria-label="Volume"
					data-testid="film-volume"
				/>

				<Menu withinPortal position="top" trigger="click">
					<Menu.Target>
						<ActionIcon
							variant="subtle"
							color="gray"
							w={44}
							aria-label="Playback speed"
							data-testid="film-rate"
						>
							<Text size="xs" fw={600}>
								{rate}×
							</Text>
						</ActionIcon>
					</Menu.Target>
					<Menu.Dropdown>
						<Menu.Label>Speed</Menu.Label>
						{PLAYBACK_RATES.map((r) => (
							<Menu.Item
								key={r}
								onClick={() => changeRate(r)}
								color={r === rate ? "blue" : undefined}
								data-testid={`film-rate-${r}`}
							>
								{r}×
							</Menu.Item>
						))}
					</Menu.Dropdown>
				</Menu>

				<Popover withinPortal position="top-end" width={220}>
					<Popover.Target>
						<ActionIcon
							variant="subtle"
							color="gray"
							aria-label="Keyboard shortcuts"
							data-testid="film-help"
						>
							<IconKeyboard size={18} />
						</ActionIcon>
					</Popover.Target>
					<Popover.Dropdown>
						<Text size="xs" fw={700} mb={6}>
							Keyboard shortcuts
						</Text>
						<Stack gap={4}>
							{SHORTCUTS.map((s) => (
								<Group key={s.action} justify="space-between" gap="md" wrap="nowrap">
									<Text size="xs" c="dimmed">
										{s.action}
									</Text>
									<Text size="xs" fw={600}>
										{s.keys}
									</Text>
								</Group>
							))}
						</Stack>
					</Popover.Dropdown>
				</Popover>

				<Tooltip label="Fullscreen (f)" withinPortal>
					<ActionIcon
						variant="subtle"
						color="gray"
						aria-label="Fullscreen"
						onClick={toggleFullscreen}
						data-testid="film-fullscreen"
						data-fullscreen={isFullscreen || undefined}
					>
						<IconMaximize size={18} />
					</ActionIcon>
				</Tooltip>
			</Group>
		</div>
	);
}
