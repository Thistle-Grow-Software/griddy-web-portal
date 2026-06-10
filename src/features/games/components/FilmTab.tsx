import { EmptyState, InlineError } from "@/components/states";
import { track } from "@/observability/analytics";
import { useAuth } from "@clerk/react";
import { Skeleton, Stack } from "@mantine/core";
import { useGamePlayback } from "../hooks";
import type { FilmPlayerEvent } from "./GameFilmPlayer";
import { GameFilmPlayer } from "./GameFilmPlayer";

// Game film for the detail page (TGF-335). Fetches a gated HLS manifest URL
// (ADR-0008) and renders the player, falling back to an empty state when the
// game predates the v1 catalog (the API answers 404) and an alert on real
// failures. The player's structured events are forwarded to PostHog via the
// analytics shim (TGF-329).
export function FilmTab({ gameId, active }: { gameId: string; active: boolean }) {
	const { userId } = useAuth();
	const query = useGamePlayback(gameId, active);

	if (query.isLoading) {
		return <Skeleton height={420} radius="md" data-testid="film-skeleton" />;
	}

	if (query.isError) {
		const status = (query.error as { status?: number }).status;
		if (status === 404) {
			return (
				<EmptyState
					title="No film available for this game"
					description="This game predates the available film catalog. Check back as we expand coverage."
				/>
			);
		}
		return <InlineError title="Couldn't load film" message={(query.error as Error).message} />;
	}

	const playback = query.data;
	if (!playback) {
		return (
			<EmptyState
				title="No film available for this game"
				description="This game predates the available film catalog. Check back as we expand coverage."
			/>
		);
	}

	const handleEvent = (event: FilmPlayerEvent) => {
		switch (event.type) {
			case "playback_started":
				track("video.playback_started", { gameId });
				break;
			case "playback_completed":
				track("video.playback_completed", { gameId });
				break;
			case "playback_error":
				track("video.playback_error", { gameId, message: event.message, fatal: event.fatal });
				break;
			default:
				// playback_progress is high-frequency; not forwarded in v1.
				break;
		}
	};

	return (
		<Stack gap="xs" data-testid="film-tab">
			<GameFilmPlayer
				src={playback.manifestUrl}
				poster={playback.poster ?? undefined}
				title="Game film"
				onEvent={handleEvent}
				// Scope resume to user + game so positions don't bleed across users
				// sharing a browser. Anonymous sessions fall back to game-only.
				storageKey={`griddy:film-pos:${userId ?? "anon"}:${gameId}`}
			/>
		</Stack>
	);
}
