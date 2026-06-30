# CALIDAD.md

Documento de calidad del proyecto **Álbum de Figuritas — Mundial 2026**. Explica,
con nuestras palabras, las decisiones que tomamos para asegurar la calidad del
producto: qué testeamos, con qué herramientas, cómo es el pipeline de CI/CD y qué
quedó como deuda técnica consciente. Refleja el sistema **tal como está
implementado y desplegado** (no un plan).

---

## 1. Estrategia general

Nuestro objetivo no es "tener tests" sino **poder desplegar con confianza**: que
nada roto llegue a producción y, si algo falla, enterarnos en el CI y no por un
usuario.

Para eso adoptamos una **pirámide de tests**:

- **Muchos unit tests baratos** sobre la **lógica de negocio pura** (autorización
  por rol, matching de búsqueda). Son las decisiones que, si se rompen, rompen la
  app de forma silenciosa. Testearlas como funciones puras es rápido, estable y no
  depende de red ni de base de datos.
- **Pocos tests E2E** sobre flujos críticos. Un E2E es caro y más frágil, así que
  lo reservamos para el recorrido que hace todo usuario.

Decisión de diseño asociada: **extraer la lógica de negocio** que vivía inline en
componentes Svelte, en `load` del servidor y en los handlers del back, hacia
**módulos puros** (`$lib/permissions.ts`, `$lib/search.ts`, `apps/back/src/lib/roles.ts`),
para poder testearla aislada y reusarla. El back valida permisos por su cuenta
(no confía en el front), por eso los predicados de rol se testean también del lado del back.

El **CI es la red de seguridad**: corre `lint → test → build → e2e` y **recién si
todo pasa** despliega. El deploy gateado es el corazón de la estrategia.

---

## 2. Herramientas seleccionadas (y por qué)

| Necesidad | Herramienta | Por qué esta y no otra |
|---|---|---|
| **Unit tests** | `bun test` | El stack es 100% Bun; su runner es nativo, sin dependencias extra, y su API es **compatible con Jest** (`describe`/`it`/`expect`). Descartamos **Vitest** (excelente, pero suma un runner cuando Bun ya trae uno). Para que `svelte-check` resuelva `bun:test` en el front sin importar todos los globals de Bun (que chocan con el DOM), usamos un shim de tipos acotado. |
| **E2E** | **Playwright** | Estándar e integrado en SvelteKit, multi-browser, con `webServer` propio para levantar back + front. Descartamos **Cypress** por peor encaje con SvelteKit. |
| **Lint** | **ESLint** (flat config) + `prettier --check` + `svelte-check` | ESLint (`typescript-eslint` + `eslint-plugin-svelte`) para reglas de calidad/bugs; Prettier para formato; `svelte-check` para tipos en `.svelte`. Complementarios. Ignoramos los componentes generados de `ui/` para no llenar de ruido. |
| **CI/CD** | **GitHub Actions** | Ya trabajamos en GitHub; integración nativa con PRs y checks. |
| **Deploy front** | **Vercel** (build server-side desde Actions) | SvelteKit + `adapter-vercel`. Desactivamos el auto-deploy por Git y deployamos desde el job (`vercel deploy --prod`) para que el gate del CI sea real. |
| **Deploy back** | **haloy** (mismo VPS) | Reemplaza a Dokploy. `haloy deploy` buildea el `Dockerfile` en el runner y sube la imagen al haloyd; corre desde Actions con un token, así queda gateado. |
| **DB para E2E** | **Branch efímero de Neon** | Se crea y destruye por corrida (copy-on-write): aislado de prod y con el **mismo Postgres** que producción. |

---

## 3. Tests desarrollados

**Unit (18 tests, `bun test`)**

- **`albumPermissions(role)`** — `apps/web/src/lib/permissions.ts`. Deriva `canEdit`/`canManage` del rol: owner/admin editan y gestionan; editor edita (marca figuritas) pero no gestiona; visitante (`null`) o rol desconocido no pueden nada. _Protege que los controles se muestren solo a quien corresponde._
- **`stickerMatchesQuery` / `normalize`** — `apps/web/src/lib/search.ts`. Búsqueda por jugador, equipo y **código FIFA** (`"ARG"` → Argentina), insensible a mayúsculas y acentos; query vacía matchea todo. _Protege la barra de búsqueda sobre 994 figuritas._
- **`isManagerRole` / `isOwnerRole` / `isEditorRole`** — `apps/back/src/lib/roles.ts`. Predicados de autorización **server-side** (fuente de verdad real): manager = owner/admin (editar álbum, miembros); owner = único que elimina; editor = owner/admin/editor (marcar figuritas).

**E2E (Playwright, `apps/web/e2e/`)**

- **`auth.e2e.ts`** — un usuario **no autenticado** que entra a una ruta protegida (`/new-album`) es redirigido a `/login`. **Corre en el CI** y es el E2E que gatea el deploy.
- **`album.e2e.ts`** — flujo principal: registro → crear álbum → marcar figurita. **Está como `test.fixme` (skippeado en CI)** por la limitación de sesión cross-origin descrita más abajo; se valida manualmente en dev/prod.

---

## 4. Casos de uso críticos

Priorizamos los flujos que **usa todo usuario** y donde un bug cuesta más:

1. **Autorización del álbum** — quién ve/edita/gestiona. Un error expone o bloquea datos de otros. Máxima prioridad (testeado en front y back).
2. **Marcar figuritas** — el core de la app.
3. **Búsqueda** — con 994 figuritas, sin búsqueda es inusable.
4. **Auth y protección de rutas** — login/logout y redirección de rutas privadas (cubierto por el E2E activo).

Por encima de flujos como configuración del álbum o compartir miembros: correctos pero de uso menos frecuente.

---

## 5. Pipeline de CI/CD

`.github/workflows/ci.yml`. **Trigger:** cada `push` y `pull request` a `main`.

**Jobs:** `lint → test → build → e2e` y, **solo en push a `main` y solo si todo pasó**, `deploy-web` + `deploy-api`.

- **lint** — `eslint .` sobre todo el repo.
- **test** — `bun test` (front + back) y `check-types` (`svelte-check` + `tsc`).
- **build** — `turbo run build` del front (con placeholders de `$env` para que SvelteKit resuelva sus tipos estáticos).
- **e2e** — crea un **branch efímero de Neon**, hace seed del catálogo, instala Playwright y corre los E2E; borra el branch al final.
- **deploy-web** — `vercel pull` + `vercel deploy --prod` (Vercel buildea server-side con el preset SvelteKit del proyecto).
- **deploy-api** — migración de prod (no bloqueante) + instalar el CLI de haloy + `haloy deploy`.

Decisiones de diseño:

- **Deploy gateado.** Ambos deploy declaran `needs: [lint, test, build, e2e]` + `if: push && ref == main`. Si cualquier paso falla, **no se despliega**. Es el objetivo central del TP. Lo vimos en la práctica: mientras debuggeábamos el E2E, el deploy quedó bloqueado hasta que el job pasó.
- **En PRs corre todo menos el deploy** → gate de revisión.
- **Si falla el lint** (o test/build/e2e): el job corta la cadena y el PR no es mergeable.
- **Migración de prod no bloqueante** (ver deuda técnica): el back compilado no trae `drizzle-kit`, así que migramos desde el runner; si el journal de prod no matchea, avisamos y seguimos.
- **E2E contra Neon efímero** para no tocar datos reales y tener un Postgres real.

---

## 6. Limitaciones y deuda técnica

- **E2E del flujo autenticado skippeado en CI.** La sesión es cross-origin: el back (`album-back.mersich.net`) setea la cookie y el front (`album.mersich.net`) la lee, compartiéndola vía `COOKIE_DOMAIN=.mersich.net`. En el CI la app corre **split-origin en localhost** (`:3000`/`:4173`), donde ese dominio no aplica y el SSR del front no ve la sesión → `/new-album` rebota a `/login`. Por eso `album.e2e.ts` quedó en `test.fixme`. **Mejor fix futuro:** smoke-test contra el deploy de Vercel (dominio real). _De hecho, olvidar `COOKIE_DOMAIN` al migrar el back a haloy causó un bug real de "login sin sesión" en prod, que arreglamos seteándolo en `haloy.yaml`._
- **Migración de prod no bloqueante.** El schema de prod no se creó con el journal de `drizzle-kit migrate`, así que `migrate` puede fallar al "recrear" objetos existentes. Lo dejamos no bloqueante y las migraciones se revisan/aplican a mano. Deuda: alinear el journal o adoptar `drizzle-kit push` controlado.
- **Solo Google OAuth** configurado en `auth.ts` (el back ya no configura GitHub, aunque históricamente se mencionaba).
- **Cobertura no medida** formalmente (no corremos un reporte `--coverage`); apuntamos a las reglas de negocio, no a un porcentaje.
- **Sin tests de componentes Svelte renderizados** (requeriría browser mode); decisión consciente de costo/beneficio.
- **Decisiones del back aún sin unit test:** `canRemoveMember` (owner no puede salir; solo managers quitan a otros) y `canViewPrivateAlbum` (visibilidad). Quedan como próxima tanda.
- **haloyd compartido:** el back se deploya a un haloyd que comparte VPS con otro proyecto.

---

## Uso de herramientas de IA

Usamos **Claude Code** para analizar las consignas, diseñar el pipeline, extraer
las funciones puras y escribir sus tests, montar el workflow de GitHub Actions y
debuggear los deploys reales (Vercel server-side, instalación de haloy, el bug de
`COOKIE_DOMAIN`). Lo que entregamos lo entendemos: cada test prueba una regla
concreta que podemos explicar, y cada decisión documentada acá la podemos defender
en persona.
