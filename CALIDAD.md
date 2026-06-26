# CALIDAD.md

Documento de calidad del proyecto **Álbum de Figuritas — Mundial 2026**. Explica,
con nuestras palabras, las decisiones que tomamos para asegurar la calidad del
producto: qué testeamos, con qué herramientas, cómo es el pipeline de CI/CD y qué
quedó como deuda técnica consciente.

> **Estado:** documento de definición. Recoge las decisiones ya tomadas por el
> equipo; parte de la implementación (tests, workflow) se completa en las fases
> siguientes. La sección _Limitaciones_ detalla qué está hecho y qué pendiente.

---

## 1. Estrategia general

Nuestro objetivo no es "tener tests" sino **poder desplegar con confianza**: que
nada que esté roto llegue a producción y, si algo falla, enterarnos en el CI y no
por un usuario.

Para eso adoptamos una **pirámide de tests**:

- **Muchos unit tests baratos** sobre la **lógica de negocio pura** (reglas de
  permisos, matching de búsqueda, cálculo de estadísticas). Son las decisiones del
  sistema que, si se rompen, rompen la app de forma silenciosa. Testearlas como
  funciones puras es rápido, estable y no depende de red ni de base de datos.
- **Pocos tests E2E** sobre el **flujo central** (login → abrir álbum → marcar
  figurita). Un E2E es caro y más frágil, así que lo reservamos para proteger el
  recorrido que hace todo usuario en cada sesión.

Decisión de diseño asociada: **extraer la lógica de negocio** que hoy vive inline
en componentes Svelte y en los `load` del servidor hacia **módulos puros**, para
poder testearla aislada (y de paso reusarla). Los endpoints del back validan
permisos por su cuenta, así que la lógica del front es solo para mostrar/ocultar
controles — pero igual la testeamos porque un error ahí confunde al usuario.

El **CI es la red de seguridad**: el pipeline corre `lint → test → build → e2e` y
**recién si todo pasa** despliega. El deploy gateado es el corazón de la estrategia.

---

## 2. Herramientas seleccionadas (y por qué)

| Necesidad | Herramienta | Por qué esta y no otra |
|---|---|---|
| **Unit tests** | `bun test` | El stack es 100% Bun; su runner es nativo, sin dependencias extra, y su API es **compatible con Jest** (`describe`/`it`/`expect`). Descartamos **Vitest** (excelente, pero suma un runner y deps cuando Bun ya trae uno); lo reconsideraríamos si necesitáramos _browser mode_ para testear componentes Svelte renderizados. |
| **E2E** | **Playwright** | Es la opción estándar e integrada en SvelteKit, multi-browser y con `webServer` propio para levantar la app. Descartamos **Cypress** por peor encaje con el modelo de SvelteKit y el testing multi-browser. |
| **Lint** | **ESLint** + `prettier --check` + `svelte-check` | ESLint (`typescript-eslint` + `eslint-plugin-svelte`) para reglas de calidad/bugs; Prettier para formato consistente (ya lo usábamos); `svelte-check` para tipos dentro de `.svelte`. Los tres son complementarios, no redundantes. |
| **CI/CD** | **GitHub Actions** | Ya trabajamos en GitHub; integración nativa con PRs, checks de estado y branch protection. |
| **Deploy front** | **Vercel** (vía CLI desde Actions) | SvelteKit + `adapter-vercel`. Lo movemos detrás del CI para que el gate sirva (desactivando el auto-deploy por Git). |
| **Deploy back** | **haloy** (mismo VPS) | Reemplaza a Dokploy. Permite **gatear el deploy desde Actions** con un token, build en el runner y swap zero-downtime. |
| **DB para E2E** | **Branch efímero de Neon** | Se crea y destruye por corrida: aislado de prod y con el **mismo motor Postgres** que producción (fidelidad real). |

---

## 3. Tests desarrollados

Casos de uso que cubre cada test y comportamiento que valida:

**Unit — `albumPermissions(role)`** (regla de autorización del front)
- `owner` / `admin` → pueden editar y gestionar.
- `editor` → puede editar (marcar figuritas) pero **no** gestionar (editar metadata, miembros, eliminar).
- visitante (`role === null`) o rol desconocido → no puede nada.
- _Valida:_ que los controles de edición/gestión se muestren solo a quien corresponde.

**Unit — `stickerMatchesQuery(sticker, query)`** (barra de búsqueda)
- Matchea por nombre de jugador, nombre de equipo **y código FIFA** del país (ej. `"ARG"` → Argentina).
- Insensible a mayúsculas y acentos (`"mbappe"` matchea `"Mbappé"`).
- Query vacía o en blanco → matchea todo.
- No-coincidencia → `false`.
- _Valida:_ que la búsqueda sobre 994 figuritas encuentre por los tres criterios.

**E2E — flujo crítico** (Playwright)
- Usuario no autenticado que entra a una ruta protegida → es redirigido a `/login`.
- Login → abrir un álbum → marcar una figurita → el contador incrementa y persiste.

**Candidatos para fases siguientes:** `canRemoveMember(...)` (el owner no puede salir;
solo managers quitan a otros) y `albumStats(...)` (conteos del gráfico donut).

---

## 4. Casos de uso críticos

Priorizamos proteger los flujos que **usa todo usuario en cada sesión** y donde un
bug tiene mayor costo:

1. **Autorización del álbum** — quién puede ver/editar/gestionar. Un error acá
   expone o bloquea datos de otros usuarios. Máxima prioridad.
2. **Marcar figuritas** — es el core de la app; si se rompe, no sirve para nada.
3. **Búsqueda** — con 994 figuritas, sin búsqueda la app es inusable.
4. **Auth y protección de rutas** — login/logout y redirección de rutas privadas.

Los dejamos **por encima** de flujos como configuración del álbum o compartir
miembros: esos son correctos e importantes, pero de uso menos frecuente y menor
impacto si fallan puntualmente.

---

## 5. Pipeline de CI/CD

**Trigger:** cada `push` y cada `pull request` a `main`.

**Pasos:** `lint → test → build → e2e` y, **solo en push a `main` y solo si todo lo
anterior pasó**: `migrate (prod) → deploy-web (Vercel) → deploy-api (haloy)`.

Decisiones de diseño:

- **Deploy gateado.** Los jobs de deploy declaran `needs: [lint, test, build, e2e]`
  y `if: push && ref == main`. Si cualquier paso falla, **no se despliega**. Es el
  objetivo central del TP: que producción solo reciba código verificado.
- **En PRs corre todo menos el deploy** → funciona como gate de revisión: un PR no
  se puede mergear si el CI está en rojo.
- **Si falla el lint:** el job de lint falla y corta la cadena; no se llega a test,
  build ni deploy, y el PR queda bloqueado. (Lo mismo aplica a cualquier paso.)
- **Migraciones como step de CI**, no en el contenedor: la imagen de runtime del
  back (Debian slim + binario compilado) no incluye `drizzle-kit`, así que las
  migraciones corren desde el runner contra la DB de prod, gateadas igual que el deploy.
- **E2E contra un branch efímero de Neon**, creado y destruido por corrida, para no
  tocar datos reales y tener un Postgres real.
- **Demostración del gate:** un PR de prueba con un test que falla deja el CI en rojo
  y **no dispara deploy** — evidencia de que el pipeline cumple su función.

---

## 6. Limitaciones y deuda técnica

- **Implementación en curso:** este documento recoge las decisiones; los tests y el
  workflow se completan en las fases siguientes (ver `docs/superpowers/`).
- **E2E con DB es la pieza más frágil:** depende de la API de Neon y de levantar
  back + front en el runner. Si se complica, el fallback documentado es correr
  Playwright contra un _preview deploy_ de Vercel — lo asumiríamos como limitación.
- **Migraciones automáticas en el deploy:** una migración destructiva podría correr
  sin intervención. Mitigación: revisión obligatoria del PR que la introduce.
- **Cobertura acotada a lógica de negocio:** no testeamos componentes Svelte
  renderizados (requeriría _browser mode_); es una elección consciente de costo/beneficio.
- **Back sin unit tests en el primer alcance:** la lógica de permisos del back
  (`canRemoveMember`, etc.) queda como deuda para una fase posterior.
- **Monorepo:** Turbo orquesta `test`/`lint`; hay que asegurar que `apps/back` no
  rompa `turbo run test` mientras no tenga tests propios.
- **`develop` desincronizada de `main`** (15 commits atrás): se resincroniza aparte.

---

## Uso de herramientas de IA

Usamos **Claude (Claude Code)** para analizar las consignas, diseñar el plan de
CI/CD, redactar este documento y proponer la extracción de funciones puras junto a
sus tests. Lo que entregamos lo entendemos: cada test prueba una regla concreta que
podemos explicar línea por línea, y cada decisión documentada acá la podemos
defender en persona.
