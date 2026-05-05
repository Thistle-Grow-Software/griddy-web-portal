import * as Sentry from "@sentry/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { initSentry, setSentryUser } from "./sentry";

vi.mock("@sentry/react", () => ({
	init: vi.fn(),
	setUser: vi.fn(),
	browserTracingIntegration: vi.fn(() => ({ name: "browser-tracing" })),
	replayIntegration: vi.fn(() => ({ name: "replay" })),
}));

describe("initSentry", () => {
	beforeEach(() => {
		vi.mocked(Sentry.init).mockClear();
	});

	it("returns false and does not call Sentry.init when no DSN is provided", () => {
		expect(initSentry({})).toBe(false);
		expect(Sentry.init).not.toHaveBeenCalled();
	});

	it("initializes Sentry with PII scrubbing and session-replay zeroed out", () => {
		expect(initSentry({ dsn: "https://abc@sentry.example.com/1", release: "sha-123" })).toBe(true);
		expect(Sentry.init).toHaveBeenCalledOnce();
		const config = vi.mocked(Sentry.init).mock.calls[0][0];
		expect(config?.dsn).toBe("https://abc@sentry.example.com/1");
		expect(config?.release).toBe("sha-123");
		expect(config?.sendDefaultPii).toBe(false);
		expect(config?.replaysSessionSampleRate).toBe(0);
		expect(config?.replaysOnErrorSampleRate).toBe(1.0);
	});

	it("scrubs email and IP from outgoing events via beforeSend", () => {
		initSentry({ dsn: "https://abc@sentry.example.com/1" });
		const config = vi.mocked(Sentry.init).mock.calls[0][0];
		const event = { user: { id: "u_1", email: "leak@example.com", ip_address: "1.2.3.4" } };
		// biome-ignore lint/suspicious/noExplicitAny: Sentry beforeSend signature is loose.
		const out = (config?.beforeSend as any)(event);
		expect(out.user.email).toBeUndefined();
		expect(out.user.ip_address).toBeUndefined();
		expect(out.user.id).toBe("u_1");
	});
});

describe("setSentryUser", () => {
	beforeEach(() => {
		vi.mocked(Sentry.setUser).mockClear();
	});

	it("sets just the id when given a userId", () => {
		setSentryUser("u_42");
		expect(Sentry.setUser).toHaveBeenCalledWith({ id: "u_42" });
	});

	it("clears the user when given null", () => {
		setSentryUser(null);
		expect(Sentry.setUser).toHaveBeenCalledWith(null);
	});
});
