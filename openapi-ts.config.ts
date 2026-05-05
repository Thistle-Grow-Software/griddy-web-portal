import { defineConfig } from "@hey-api/openapi-ts";

export default defineConfig({
	input: "src/api/schema.yaml",
	output: {
		path: "src/api/generated",
	},
	plugins: ["@hey-api/typescript", "@hey-api/sdk", "@hey-api/client-fetch"],
});
