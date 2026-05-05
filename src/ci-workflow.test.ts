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

	it("deploys only on push events (no PR previews)", () => {
		expect(workflow).toMatch(/if:\s*>-?\s*\n\s*github\.event_name == 'push'/);
	});

	it("does not post preview-URL comments on pull requests", () => {
		expect(workflow).not.toContain("actions/github-script");
		expect(workflow).not.toContain("griddy-web-portal-preview");
	});
});
