import * as Sentry from "@sentry/react";

export type SentryInitOptions = {
	dsn?: string;
	environment?: string;
	release?: string;
	tracesSampleRate?: number;
};

/**
 * Initializes Sentry. Returns true if initialization actually ran, false if it
 * was skipped because no DSN was supplied (the local-dev no-op path).
 */
export function initSentry(options: SentryInitOptions): boolean {
	if (!options.dsn) {
		return false;
	}

	Sentry.init({
		dsn: options.dsn,
		environment: options.environment,
		release: options.release,
		// Don't auto-attach IP address / cookies / common PII fields.
		sendDefaultPii: false,
		integrations: [Sentry.browserTracingIntegration(), Sentry.replayIntegration()],
		tracesSampleRate: options.tracesSampleRate ?? 0,
		// Only capture replays for sessions that actually error. Free-tier-friendly.
		replaysSessionSampleRate: 0,
		replaysOnErrorSampleRate: 1.0,
		beforeSend(event) {
			// Belt-and-suspenders PII scrub: even with sendDefaultPii false, some
			// integrations or manual setUser calls can leak email/IP. Strip both.
			if (event.user) {
				event.user.email = undefined;
				event.user.ip_address = undefined;
			}
			return event;
		},
	});

	return true;
}

/**
 * Sets (or clears) the Sentry user context. Pass only the Clerk user ID — never
 * email, name, or any PII. No-op if Sentry was never initialized.
 */
export function setSentryUser(userId: string | null): void {
	if (userId) {
		Sentry.setUser({ id: userId });
	} else {
		Sentry.setUser(null);
	}
}
