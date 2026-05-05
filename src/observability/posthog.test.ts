import posthog from "posthog-js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	__resetForTests,
	identifyUser,
	initPostHog,
	resetUser,
	setAnalyticsOptOut,
	track,
} from "./posthog";

vi.mock("posthog-js", () => ({
	default: {
		init: vi.fn(),
		identify: vi.fn(),
		reset: vi.fn(),
		capture: vi.fn(),
		opt_in_capturing: vi.fn(),
		opt_out_capturing: vi.fn(),
	},
}));

describe("initPostHog", () => {
	beforeEach(() => {
		__resetForTests();
		vi.clearAllMocks();
	});

	it("returns false and does not call posthog.init when no key is provided", () => {
		expect(initPostHog({})).toBe(false);
		expect(posthog.init).not.toHaveBeenCalled();
	});

	it("initializes PostHog with US-cloud default and respects DNT", () => {
		expect(initPostHog({ apiKey: "phc_test_abc" })).toBe(true);
		expect(posthog.init).toHaveBeenCalledOnce();
		const [key, options] = vi.mocked(posthog.init).mock.calls[0];
		expect(key).toBe("phc_test_abc");
		expect(options?.api_host).toBe("https://us.i.posthog.com");
		expect(options?.respect_dnt).toBe(true);
		expect(options?.autocapture).toBe(true);
	});

	it("uses a custom host when provided", () => {
		initPostHog({ apiKey: "phc_test_abc", apiHost: "https://eu.i.posthog.com" });
		const options = vi.mocked(posthog.init).mock.calls[0][1];
		expect(options?.api_host).toBe("https://eu.i.posthog.com");
	});

	it("does not double-initialize", () => {
		initPostHog({ apiKey: "phc_test_abc" });
		expect(initPostHog({ apiKey: "phc_test_abc" })).toBe(false);
		expect(posthog.init).toHaveBeenCalledOnce();
	});
});

describe("user lifecycle helpers no-op when not initialized", () => {
	beforeEach(() => {
		__resetForTests();
		vi.clearAllMocks();
	});

	it("identifyUser, resetUser, track, and setAnalyticsOptOut do nothing", () => {
		identifyUser("u_1");
		resetUser();
		track("auth.signed_in");
		setAnalyticsOptOut(true);
		expect(posthog.identify).not.toHaveBeenCalled();
		expect(posthog.reset).not.toHaveBeenCalled();
		expect(posthog.capture).not.toHaveBeenCalled();
		expect(posthog.opt_in_capturing).not.toHaveBeenCalled();
		expect(posthog.opt_out_capturing).not.toHaveBeenCalled();
	});
});

describe("user lifecycle helpers after init", () => {
	beforeEach(() => {
		__resetForTests();
		vi.clearAllMocks();
		initPostHog({ apiKey: "phc_test_abc" });
	});

	it("identifies the user by id only", () => {
		identifyUser("u_42");
		expect(posthog.identify).toHaveBeenCalledWith("u_42");
	});

	it("resets on sign-out", () => {
		resetUser();
		expect(posthog.reset).toHaveBeenCalledOnce();
	});

	it("track passes event name and props through to posthog.capture", () => {
		track("stats.filter_applied", { league: "NFL" });
		expect(posthog.capture).toHaveBeenCalledWith("stats.filter_applied", { league: "NFL" });
	});

	it("setAnalyticsOptOut(true) routes to opt_out_capturing", () => {
		setAnalyticsOptOut(true);
		expect(posthog.opt_out_capturing).toHaveBeenCalledOnce();
		expect(posthog.opt_in_capturing).not.toHaveBeenCalled();
	});

	it("setAnalyticsOptOut(false) routes to opt_in_capturing", () => {
		setAnalyticsOptOut(false);
		expect(posthog.opt_in_capturing).toHaveBeenCalledOnce();
		expect(posthog.opt_out_capturing).not.toHaveBeenCalled();
	});
});
