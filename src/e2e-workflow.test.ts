import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const workflow = readFileSync(resolve(process.cwd(), ".github", "workflows", "e2e.yml"), "utf8");

describe("E2E workflow", () => {
	it("runs only on main pushes and manual dispatch — not every PR", () => {
		expect(workflow).toMatch(/push:\s*\n\s*branches:\s*\[main\]/);
		expect(workflow).toContain("workflow_dispatch:");
		expect(workflow).not.toMatch(/^\s*pull_request:/m);
	});

	it("installs Playwright browsers and runs the suite via pnpm", () => {
		expect(workflow).toContain("playwright install");
		expect(workflow).toContain("pnpm test:e2e");
	});

	it("uploads playwright-report and per-failure traces as artifacts", () => {
		expect(workflow).toContain("name: playwright-report");
		expect(workflow).toContain("path: playwright-report/");
		expect(workflow).toContain("name: playwright-test-results");
		expect(workflow).toContain("path: test-results/");
	});

	it("wires the Clerk testing credentials into the test step", () => {
		expect(workflow).toContain("CLERK_PUBLISHABLE_KEY:");
		expect(workflow).toContain("CLERK_SECRET_KEY:");
		expect(workflow).toContain("E2E_CLERK_USER_USERNAME:");
		expect(workflow).toContain("E2E_CLERK_USER_PASSWORD:");
	});
});
