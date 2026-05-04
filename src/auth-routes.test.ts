import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const generated = readFileSync(resolve(process.cwd(), "src/routeTree.gen.ts"), "utf8");

describe("auth-related routes are registered", () => {
	it("includes the splat sign-in route", () => {
		expect(generated).toMatch(/id:\s*"\/sign-in\/\$"/);
	});

	it("includes the splat sign-up route", () => {
		expect(generated).toMatch(/id:\s*"\/sign-up\/\$"/);
	});

	it("includes the settings route", () => {
		expect(generated).toMatch(/id:\s*"\/settings"/);
	});
});
