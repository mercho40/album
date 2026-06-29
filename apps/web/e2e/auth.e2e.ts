import { test, expect } from "@playwright/test";

// Caso de uso crítico: protección de rutas.
// Un usuario no autenticado que intenta entrar a una ruta protegida es
// redirigido a /login (guardado por (protected)/+layout.server.ts).
test("un usuario no autenticado es redirigido a /login", async ({ page }) => {
	await page.goto("/new-album");
	await expect(page).toHaveURL(/\/login(\?|$)/);
});
