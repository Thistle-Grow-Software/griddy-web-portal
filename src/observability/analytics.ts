// Analytics shim — emits structured product events. PostHog wiring is
// deferred to TGF-329, so today this is a no-op (or a console log in dev so
// developers can see the event firing). When the real PostHog client lands,
// swap the body of `track()` to call `posthog.capture(event, props)` and
// nothing in the call sites needs to change.

type Primitive = string | number | boolean | null | undefined;
export type EventProps = Record<string, Primitive | Primitive[]>;

const isDev = import.meta.env.MODE === "development";

export function track(event: string, props?: EventProps): void {
	if (isDev) {
		// eslint-disable-next-line no-console -- intentional dev-only signal
		console.debug(`[analytics] ${event}`, props ?? {});
	}
	// TODO(TGF-329): forward to posthog.capture(event, props) once the client
	// is initialized in src/observability/posthog.ts.
}
