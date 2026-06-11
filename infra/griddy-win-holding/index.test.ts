import { describe, expect, it } from "vitest";
import worker from "./index";

describe("griddy.win holding worker", () => {
	it("serves the holding page on the apex", async () => {
		const res = await worker.fetch(new Request("https://griddy.win/"));
		expect(res.status).toBe(200);
		expect(res.headers.get("content-type")).toContain("text/html");
		expect(await res.text()).toContain("Griddy");
	});

	it("301-redirects www to the apex, preserving path and query", async () => {
		const res = await worker.fetch(new Request("https://www.griddy.win/some/path?a=1"));
		expect(res.status).toBe(301);
		expect(res.headers.get("location")).toBe("https://griddy.win/some/path?a=1");
	});

	it("serves the holding page on arbitrary apex paths", async () => {
		const res = await worker.fetch(new Request("https://griddy.win/anything"));
		expect(res.status).toBe(200);
	});
});
