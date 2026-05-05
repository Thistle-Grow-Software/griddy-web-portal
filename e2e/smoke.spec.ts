import { expect, test } from "@playwright/test";

// Auth comes from the persisted storage state set up by `auth.setup.ts`. The
// "sign-in works end-to-end" assertion is covered by the setup project — if
// that fails, every test in this project fails its dependency check, which
// is the smoke signal we want.
test.describe("smoke", () => {
	test("authenticated user lands on home and can navigate to /teams", async ({ page }) => {
		await page.goto("/");
		await expect(page.getByRole("heading", { name: /griddy web portal/i })).toBeVisible();

		await page.goto("/teams");
		await expect(page).toHaveURL(/\/teams$/);
	});
});
