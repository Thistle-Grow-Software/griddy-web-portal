import "@testing-library/jest-dom/vitest";
import { afterAll, afterEach, beforeAll, vi } from "vitest";
import { server } from "./src/mocks/server";

// MSW: any request without a matching handler fails the test instead of
// silently hitting the network. Keeps tests deterministic and forces every
// new fetch to be declared in src/mocks/handlers.ts (or overridden per-test
// with server.use(...)).
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

if (typeof window !== "undefined") {
	if (!window.matchMedia) {
		window.matchMedia = vi.fn().mockImplementation((query: string) => ({
			matches: false,
			media: query,
			onchange: null,
			addListener: vi.fn(),
			removeListener: vi.fn(),
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
			dispatchEvent: vi.fn(),
		}));
	}

	if (!window.visualViewport) {
		Object.defineProperty(window, "visualViewport", {
			configurable: true,
			value: {
				width: window.innerWidth,
				height: window.innerHeight,
				offsetLeft: 0,
				offsetTop: 0,
				pageLeft: 0,
				pageTop: 0,
				scale: 1,
				addEventListener: vi.fn(),
				removeEventListener: vi.fn(),
				dispatchEvent: vi.fn(),
			},
		});
	}

	if (!window.scrollTo) {
		window.scrollTo = vi.fn() as typeof window.scrollTo;
	}

	if (typeof document !== "undefined" && !("fonts" in document)) {
		Object.defineProperty(document, "fonts", {
			configurable: true,
			value: {
				ready: Promise.resolve(),
				addEventListener: vi.fn(),
				removeEventListener: vi.fn(),
				dispatchEvent: vi.fn(),
			},
		});
	}
}

if (typeof globalThis.ResizeObserver === "undefined") {
	globalThis.ResizeObserver = class ResizeObserver {
		observe() {}
		unobserve() {}
		disconnect() {}
	};
}

if (typeof globalThis.IntersectionObserver === "undefined") {
	globalThis.IntersectionObserver = class IntersectionObserver {
		root = null;
		rootMargin = "";
		thresholds = [];
		observe() {}
		unobserve() {}
		disconnect() {}
		takeRecords() {
			return [];
		}
	} as unknown as typeof IntersectionObserver;
}
