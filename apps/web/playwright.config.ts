import { defineConfig, devices } from "@playwright/test";

// E2E del front. Playwright levanta el back (3000) y el front buildeado (4173) y
// corre los specs de `e2e/` contra el front.
//
// Requiere en el entorno (lo inyecta el workflow de CI desde un branch efímero
// de Neon; localmente, desde apps/*/.env):
//   DATABASE_URL, BETTER_AUTH_SECRET, BETTER_AUTH_URL, WEB_URL, PUBLIC_API_URL
const WEB_PORT = 4173;
const API_PORT = 3000;

export default defineConfig({
	testDir: "e2e",
	testMatch: "**/*.e2e.ts",
	fullyParallel: false,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 1 : 0,
	reporter: process.env.CI ? "github" : "list",
	use: {
		baseURL: `http://localhost:${WEB_PORT}`,
		trace: "on-first-retry",
	},
	projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
	webServer: [
		{
			command: "cd ../back && bun run src/index.ts",
			port: API_PORT,
			reuseExistingServer: !process.env.CI,
			timeout: 60_000,
		},
		{
			command: `bun run build && bun run preview --port ${WEB_PORT}`,
			port: WEB_PORT,
			reuseExistingServer: !process.env.CI,
			timeout: 120_000,
		},
	],
});
