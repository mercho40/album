import { test, expect } from "@playwright/test";

// Flujo principal de la app: registro → crear álbum → marcar una figurita.
// Cubre el camino completo que recorre un usuario nuevo en su primera sesión.
test("registro, creación de álbum y marcado de una figurita", async ({ page }) => {
	const unique = `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
	const email = `e2e-${unique}@example.com`;
	const password = "e2e-password-123";

	// 1. Registro
	await page.goto("/signup");
	await page.getByLabel("Email", { exact: true }).fill(email);
	// exact: el toggle "Mostrar contraseña" también matchea "Contraseña".
	await page.getByLabel("Contraseña", { exact: true }).fill(password);
	await page.getByRole("button", { name: "Crear cuenta" }).click();

	// Tras el signup, la app redirige a /new-album.
	await expect(page).toHaveURL(/\/new-album/);

	// 2. Crear álbum
	await page.getByLabel("Nombre", { exact: true }).fill(`E2E ${unique}`);
	await page.getByRole("button", { name: "Crear álbum" }).click();

	// Redirige a la vista del álbum recién creado.
	await expect(page).toHaveURL(/\/albums\//);

	// 3. Marcar la primera figurita. Una card con count 0 (en modo edición) es
	//    un botón "Marcar {jugador} como obtenida".
	const primera = page.getByRole("button", { name: /Marcar .* como obtenida/ }).first();
	await primera.click();

	// Al marcarla aparece el control de cantidad con el botón "Sumar una ...".
	await expect(page.getByRole("button", { name: /Sumar una/ }).first()).toBeVisible();
});
