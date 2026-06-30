# Álbum de Figuritas — Mundial 2026

App web para registrar las figuritas del álbum Panini Mundial 2026: marcá las que tenés y las repetidas, compartí tu álbum con familia o amigos para llevar la cuenta entre varios. Próximamente: encontrá automáticamente con quién podés intercambiar.

🌐 **Demo:** [album.mersich.net](https://album.mersich.net) — API en [album-back.mersich.net](https://album-back.mersich.net). Deploy automático desde `main` vía el pipeline de CI/CD (gateado).
📦 **Repo:** [github.com/mercho40/album](https://github.com/mercho40/album)

## Integrantes

- **Simon Mersich** — Backend (schema, hook, endpoints, integración auth/db)
- **Oliver Jones** — Frontend (componentes, pantallas, deploy front)

## Funcionalidades (MVP1)

- ✅ Registro / login con email + password (Google disponible vía OAuth)
- ✅ Crear álbumes propios con visibilidad configurable (`public` / `unlisted` / `private`)
- ✅ Marcar figuritas: poseídas y repetidas, sobre catálogo completo WC2026 (994 stickers)
- ✅ Persistencia en Postgres (Neon) con Drizzle
- ✅ Despliegue: Vercel (front) + haloy (back, Docker + Bun) + Neon (DB), vía pipeline de CI/CD gateado

## Funcionalidades (MVP2 — en desarrollo)

- ✅ Compartir álbum: agregar miembros por email (si ya tienen cuenta) con rol `editor`; quitar miembros; salir del álbum (#52, #56)
- ✅ Configuración del álbum: editar nombre/descripción/visibilidad y eliminar el álbum (#52)
- ✅ Copiar link del álbum al portapapeles desde el header (#58)
- 🚧 Invitaciones por email (sin email provider configurado todavía — por ahora solo direct-add)
- 🚧 Directorio público + matchmaker (encontrar con quién intercambiar automáticamente)
- 🚧 Propuestas de intercambio con máquina de estados (`pending` → `accepted` → `completed`)
- 🚧 Avatar de usuario (CDN: Vercel Blob)
- 🚧 Edición de perfil del usuario

## Stack

- **Runtime:** Bun
- **Monorepo:** Turborepo
- **Frontend:** SvelteKit 5 (runes), Tailwind 4, shadcn-svelte
- **Backend:** Elysia (Bun)
- **Auth:** Better Auth (email/password + Google) con plugin `organization()`
- **DB:** Drizzle ORM + PostgreSQL (Neon)
- **API:** Eden Treaty (RPC type-safe extremo a extremo)
- **Hosting:** Vercel (front) + haloy (back, contenedor Docker con Bun, en un VPS) + Neon (DB)
- **CI/CD:** GitHub Actions (lint → test → build → e2e → deploy gateado); tests con `bun test` + Playwright

## Decisiones técnicas

### 1. Type-safety end-to-end con Eden Treaty
El front importa el tipo `App` del back (`import type { App } from "@back/index"`) y obtiene autocompletado y validación en cada call. Cada endpoint nuevo es automáticamente tipado en el frontend sin ningún code generation step.

### 2. `album` como extensión de `organization`
Reusamos las tablas de Better Auth (`organization`, `member`, `invitation`) como base para "álbum compartido + miembros + invitaciones por email". La tabla `album` extiende `organization` con FK 1-a-1 (`album.organization_id` PK + FK). Un hook `afterCreateOrganization` del plugin garantiza que toda nueva org tenga su `album` asociado.

Esto nos da gratis las invitaciones por email y la gestión de miembros con roles para el MVP2 (compartir álbum) sin escribir lógica de invitations from scratch.

### 3. Catálogo cerrado y solo-lectura desde la app
El seed de figuritas (`apps/back/seed/wc2026.json`) se carga vía script administrativo (`bun run db:seed`). No hay endpoints públicos para crear/modificar figuritas. Esto garantiza integridad referencial entre álbumes — todos los usuarios apuntan al mismo `sticker.id`.

### 4. Optimistic updates en marcar figuritas
La grilla del álbum hace un PATCH al servidor pero actualiza la UI inmediatamente. Si el servidor rechaza el cambio, revierte el estado local. Resultado: percepción de instantaneidad incluso con latencia visible.

### 5. Hosting híbrido: Vercel (front) + haloy (back)
El front es SvelteKit con `@sveltejs/adapter-vercel`. El back es Elysia + Bun + Better Auth, contenedorizado con un `Dockerfile` multi-stage en la raíz (build con `bun build --compile` a binario standalone, runtime Debian slim). El deploy del back lo hace **haloy** (`haloy deploy` buildea el `Dockerfile` y sube la imagen a un haloyd en un VPS), disparado desde el pipeline de CI/CD y solo si todos los pasos pasan. El front llama al back cross-origin con CORS y `credentials: "include"`.

Como front (`album.mersich.net`) y back (`album-back.mersich.net`) son subdominios del mismo dominio, la cookie de sesión se comparte con `COOKIE_DOMAIN=.mersich.net` (`crossSubDomainCookies`); `cookieCache.maxAge=7d` evita re-logins espurios.

**Por qué no Vercel para el back:** Better Auth crashea al cargarse en el runtime Bun de Vercel (circular dependencies según [issue Vercel community](https://community.vercel.com/t/elysia-and-bun-serverless-function-fails-with-exit-status-1-on-vercel/33734)). haloy nos da un proceso Bun persistente, sin cold starts y compatible con todo el stack.

### 6. Permisos resueltos server-side
El layout server load del álbum calcula `canView`, `canEdit`, `canManage` en base al rol del miembro (o ausencia de rol para visitantes). El front solo muestra/oculta controles según los flags. Los endpoints **también** validan permisos (no confían en el front).

Roles actuales: `owner` (creador, único que puede editar metadata o eliminar) y `editor` (invitado, puede marcar figuritas). Visitantes (no miembros) ven el álbum si `visibility !== "private"` pero no pueden marcar.

### 7. Sharing sin email provider
El owner agrega miembros tipeando un email; el back lo busca en la tabla `user`. Si la persona ya tiene cuenta, se inserta una fila en `member` con rol `editor`. Si no, devuelve 404 con un mensaje pidiendo que se registre primero. Sin email provider ni share-links — minimum viable hasta tener Resend o similar configurado.

### 8. Streaming load para figuritas
`/albums/:slug/+page.server.ts` devuelve la promesa de figuritas sin `await`. SvelteKit la stremea al browser, así el layout (metadata + rol, ~150ms) renderiza el header del álbum apenas resuelve y la grilla cae después con su skeleton. El click en un álbum desde el home se siente ~3× más rápido que esperar las 994 figuritas antes de pintar nada.

## Setup local

### Pre-requisitos
- [Bun 1.3+](https://bun.sh)
- Cuenta en [Neon](https://neon.tech) (free tier)

### Pasos

```bash
# Clonar e instalar
git clone https://github.com/mercho40/album.git
cd album
bun install

# Configurar envs (copiar y completar):
cp apps/back/.env.example apps/back/.env
cp apps/web/.env.example apps/web/.env

# DATABASE_URL: pegá la URL de tu Neon branch
# BETTER_AUTH_SECRET: el mismo en ambos apps. Generar con:
openssl rand -base64 32

# Aplicar migraciones + cargar seed
cd apps/back
bunx drizzle-kit migrate
bun run db:seed

# Volver a raíz y arrancar
cd ../..
bun run dev
```

- Front: http://localhost:3001
- Back: http://localhost:3000

## Branches

| Rama | Propósito |
|---|---|
| `main` | Producción. Solo recibe merges desde `develop`. |
| `develop` | Integración. Recibe PRs de `simon` / `oliver` / sub-ramas de feature. |
| `simon` | Rama personal de Simon (back). |
| `oliver` | Rama personal de Oliver (front). |

**Workflow:**
1. Feature en `simon` o `oliver` (commits con conventional commits, en español).
2. PR a `develop` con review del compañero.
3. Cuando `develop` está estable: PR `develop` → `main` con tag SemVer.

**Convención de nombres (TP3):** el trabajo va en ramas `feature/<nombre>` (funcionalidad/mejora) o `fix/<nombre>` (bug). Cada rama nace de un issue y se mergea por PR con `closes #N` y review del compañero — nada va directo a `main`.

## CI/CD

Pipeline de GitHub Actions (`.github/workflows/ci.yml`) en cada push y PR a `main`:
`lint` → `test` → `build` → `e2e`, y **solo si todo pasa en un push a `main`**, deploy.

- **lint** — ESLint (`eslint .`).
- **test** — unit con `bun test` (front + back) + `check-types`.
- **build** — `turbo run build` del front.
- **e2e** — Playwright contra la app levantada sobre un branch efímero de Neon (creado y destruido por corrida).
- **deploy** — gateado por `needs: [lint, test, build, e2e]`: si algo falla, no se despliega. Front a Vercel y back vía `haloy deploy`; las migraciones de prod corren como paso de CI antes del deploy del back.

Estrategia, herramientas y casos de uso documentados en [CALIDAD.md](./CALIDAD.md).

## Versionado

SemVer:
- `v0.1.0` — MVP1: álbum + marcar figuritas + deploy.
- `v0.4.x` — Polish UX (skeletons, mobile padding, header redesign, navegación).
- `v0.5.x` — Sprint social parcial: compartir álbum (direct-add), configuración del álbum, eliminar.
- `v0.6.x` — Sprint social completo (pendiente): invitaciones por email, directorio, avatar.
- `v1.0.0` — Entrega final: matchmaker + trades.

## Scripts

### Raíz (Turbo orquesta los 2 apps)

| Comando | Descripción |
|---|---|
| `bun run dev` | Levanta back y front en paralelo |
| `bun run build` | Build de los dos apps |
| `bun run check-types` | Type-check del monorepo |
| `bun run format` | Prettier sobre todo |

### Backend (`apps/back/`)

| Comando | Descripción |
|---|---|
| `bun run db:generate` | Genera migración nueva desde schema |
| `bun run db:migrate` | Aplica migraciones a la DB |
| `bun run db:seed` | Carga el catálogo en la DB |
| `bun run db:studio` | Abre Drizzle Studio (UI) |

## Estructura del proyecto

```
apps/
  back/                            Elysia API server (port 3000)
    src/
      index.ts                       Wireup + CORS + /health
      lib/auth.ts                    Better Auth + plugin organization + hook
      db/schema.ts                   Drizzle: user/session/account/org + sticker/album/albumSticker
      db/drizzle.ts                  Cliente DB (bun-sql)
      db/seed.ts                     Script de seed (idempotente)
      routes/_shared.ts              Macro betterAuth con resolve de session
      routes/catalog.ts              GET /catalog/:id/stickers + detalle
      routes/albums.ts               CRUD de álbumes + members (add/remove/list) + PATCH/DELETE
      routes/album-stickers.ts       GET/PATCH inventario del álbum
    seed/wc2026.json                 Catálogo completo (994 figuritas)
    migrations/                      SQL generado por drizzle-kit
    vercel.json                      Deploy en Vercel (Bun runtime)

  web/                             SvelteKit frontend (port 3001)
    src/
      hooks.server.ts                Auth session desde cookie cache
      lib/api.ts                     createApi(fetch) → Eden Treaty client
      lib/auth-client.ts             Better Auth client (organization plugin)
      lib/components/
        back-link.svelte               BackLink unificado (icono chevron)
        sticker-card.svelte            Card compacta con número como hero
        sticker-grid.svelte            Grilla agrupada por equipo + filtros
        share-dialog.svelte            Dialog de miembros (agregar/quitar/salir)
        login-form.svelte              Form de login
        signup-form.svelte             Form de signup
        theme-toggle.svelte            Toggle de tema (landing logged-out)
        ui/                            shadcn-svelte primitives
      routes/
        +page.svelte                   Landing (logged-out) / lista de álbumes (logged-in)
        login/, signup/                Auth pages
        directory/                     (MVP2)
        albums/[slug]/                 Vista universal (read+edit según permisos)
          settings/                    Config del álbum (solo owner)
        (protected)/
          new-album/                   Form de creación
          me/                          Editar perfil (MVP2)
```

## Estado del proyecto

Este TP se desarrolló iterativamente con un spec + plan en `docs/superpowers/`:
- Spec: `2026-05-02-album-figuritas-design.md`
- Plan MVP1: `2026-05-02-album-mvp1-plan.md`

(Los `docs/` están gitignoreados — quedan locales como referencia interna del equipo.)
