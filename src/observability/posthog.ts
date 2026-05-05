import posthog from "posthog-js";

export type PostHogInitOptions = {
	apiKey?: string;
	apiHost?: string;
};

/**
 * Event names follow `domain.action` (e.g. `auth.signed_in`,
 * `stats.filter_applied`, `video.playback_started`). Documented in README.
 */
export type EventName = `${string}.${string}`;

let initialized = false;

/**
 * Initializes PostHog. Returns true if initialization ran, false if it was
 * skipped (no key, or already initialized — both are normal in dev/HMR).
 */
export function initPostHog(options: PostHogInitOptions): boolean {
	if (!options.apiKey || initialized) {
		return false;
	}

	posthog.init(options.apiKey, {
		api_host: options.apiHost ?? "https://us.i.posthog.com",
		capture_pageview: true,
		autocapture: true,
		respect_dnt: true,
		persistence: "localStorage+cookie",
	});

	initialized = true;
	return true;
}

export function identifyUser(userId: string): void {
	if (!initialized) return;
	posthog.identify(userId);
}

export function resetUser(): void {
	if (!initialized) return;
	posthog.reset();
}

/**
 * Programmatic opt-out. Settings-page UI toggle is tracked separately as a
 * follow-up. PostHog also automatically respects the browser's Do Not Track
 * signal at init time (`respect_dnt: true`).
 */
export function setAnalyticsOptOut(optOut: boolean): void {
	if (!initialized) return;
	if (optOut) {
		posthog.opt_out_capturing();
	} else {
		posthog.opt_in_capturing();
	}
}

export function track(event: EventName, properties?: Record<string, unknown>): void {
	if (!initialized) return;
	posthog.capture(event, properties);
}

/**
 * Test-only reset of the module-level `initialized` flag so tests can re-init
 * with different options. Not exported from the package's public surface.
 */
export function __resetForTests(): void {
	initialized = false;
}
