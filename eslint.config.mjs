import js from "@eslint/js";
import ts from "typescript-eslint";
import svelte from "eslint-plugin-svelte";
import globals from "globals";
import svelteConfig from "./apps/web/svelte.config.js";

export default ts.config(
	{
		ignores: [
			"**/node_modules/",
			"**/build/",
			"**/.svelte-kit/",
			"**/.vercel/",
			"**/dist/",
			"**/.turbo/",
			"apps/back/server",
			// Componentes generados de shadcn-svelte (bits-ui): no los linteamos.
			"apps/web/src/lib/components/ui/**",
			// SQL generado por drizzle-kit.
			"apps/back/migrations/**",
			// Scripts de scraping/seed locales (tooling, no código de producción).
			"apps/back/scripts/**",
		],
	},
	js.configs.recommended,
	...ts.configs.recommended,
	...svelte.configs.recommended,
	{
		languageOptions: {
			globals: { ...globals.browser, ...globals.node },
		},
	},
	{
		files: ["**/*.svelte", "**/*.svelte.ts", "**/*.svelte.js"],
		languageOptions: {
			parserOptions: {
				parser: ts.parser,
				extraFileExtensions: [".svelte"],
				svelteConfig,
			},
		},
	},
	{
		rules: {
			// Permite descartar valores con `_` (args, vars, catch).
			"@typescript-eslint/no-unused-vars": [
				"error",
				{ argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_" },
			],
			// La app se sirve en la raíz (sin base path), los href planos son intencionales.
			"svelte/no-navigation-without-resolve": "off",
		},
	},
);
