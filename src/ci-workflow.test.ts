import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const workflow = readFileSync(resolve(process.cwd(), ".github", "workflows", "ci.yml"), "utf8");

describe("CI workflow", () => {
	it("triggers on pull_request and on push to main", () => {
		expect(workflow).toMatch(/on:\s*\n\s*pull_request:/);
		expect(workflow).toMatch(/push:\s*\n\s*branches:\s*\[main\]/);
	});

	it("runs lint, typecheck, test, and build via pnpm", () => {
		expect(workflow).toContain("pnpm install --frozen-lockfile");
		expect(workflow).toContain("pnpm lint");
		expect(workflow).toContain("pnpm typecheck");
		expect(workflow).toContain("pnpm test");
		expect(workflow).toContain("pnpm build");
	});

	it("uses pnpm cache via setup-node", () => {
		expect(workflow).toContain("pnpm/action-setup");
		expect(workflow).toMatch(/cache:\s*pnpm/);
		expect(workflow).toMatch(/node-version:\s*24/);
	});

	it("uploads dist/ for the deploy job", () => {
		expect(workflow).toContain("actions/upload-artifact");
		expect(workflow).toMatch(/path:\s*dist\//);
	});

	it("deploys to Cloudflare Pages with branch-aware URL", () => {
		expect(workflow).toContain("cloudflare/wrangler-action");
		expect(workflow).toContain("pages deploy dist/ --project-name=griddy-web-portal");
		expect(workflow).toContain("github.head_ref || github.ref_name");
	});

	it("skips deploy on forked-PR runs (no secret access)", () => {
		expect(workflow).toContain(
			"github.event.pull_request.head.repo.full_name == github.repository",
		);
	});

	it("posts a sticky preview-URL comment on pull requests", () => {
		expect(workflow).toContain("actions/github-script");
		expect(workflow).toContain("<!-- griddy-web-portal-preview -->");
		expect(workflow).toContain("deployment-url");
		expect(workflow).toContain("github.event_name == 'pull_request'");
	});
});
