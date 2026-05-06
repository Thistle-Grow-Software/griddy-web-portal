import { describe, expect, it } from "vitest";
import { REGISTRY } from "./registry";
import { ENTITIES } from "./types";

describe("REGISTRY", () => {
	it("has an entry for every Entity", () => {
		for (const entity of ENTITIES) {
			expect(REGISTRY[entity]).toBeDefined();
			expect(REGISTRY[entity].entity).toBe(entity);
		}
	});

	it("default columns must reference real column ids", () => {
		for (const reg of Object.values(REGISTRY)) {
			const colIds = new Set(reg.columns.map((c) => c.id));
			for (const id of reg.defaultColumns) {
				expect(colIds.has(id)).toBe(true);
			}
		}
	});

	it("default sort must reference a sortable column id", () => {
		for (const reg of Object.values(REGISTRY)) {
			const sortable = reg.columns.filter((c) => c.sortable).map((c) => c.id);
			expect(sortable).toContain(reg.defaultSort.id);
		}
	});
});
