// Path to the persisted Clerk session — set by `auth.setup.ts`, consumed by
// the `chromium` project in `playwright.config.ts`. Lives in its own file so
// the Playwright config can import the constant without pulling in
// `test.describe`/`test.describe.configure` (which fail when evaluated at
// config-load time).
export const STORAGE_STATE = "playwright/.auth/user.json";
