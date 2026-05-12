# CLAUDE.md

Guía para Claude Code al trabajar en este repositorio.

## Layout

Dos proyectos hermanos bajo un mismo directorio. **No hay `package.json` raíz ni workspaces** — cada proyecto se instala, compila y ejecuta independientemente.

- [topitop-backend/](topitop-backend/) — API Hono sobre Node.js (ESM, TypeScript, `module: NodeNext`)
- [topitop-frontend/](topitop-frontend/) — SPA Vite + React 19 + TypeScript

El producto actual es un **portal interno multi-rol** con autenticación email+contraseña, gestión de usuarios y redirección por rol. **No es ecommerce** — el dominio (topitop.pe) es retail, pero esto es solo el panel administrativo interno.

## Dominio funcional

Flujo del producto:
```
PIM (carga) → PRICING (precio + stock + promo) → catálogo → ORDER_MANAGEMENT (venta + envío + track)
```

**admin** — gestión de cuentas, roles y permisos. CRUD de usuarios.

**PIM (Product Information Management)** — carga inicial de productos: fotos, descripción, título, atributos digitales. Tras cargarlos pasan a Pricing.
> **Brecha conocida a resolver:** hoy **no existe historial de cambios** sobre los productos. Cualquier feature nueva en PIM debe contemplar auditoría/rollback desde el inicio.

**PRICING** — promociones, descuentos y reestockeo de productos.
> **Restricción crítica:** existe un **margen mínimo por defecto** que no se puede violar para evitar pérdidas. Toda promoción o descuento debe validar contra ese margen antes de aplicarse.

**ORDER_MANAGEMENT** — envíos, pedidos de clientes y tracking. Es el final del flujo.

## Comandos

Correr desde la carpeta del proyecto correspondiente.

### Backend (`topitop-backend/`)
- `npm run dev` — `tsx watch src/index.ts`, server en `http://localhost:3000`
- `npm run build` — `tsc` a `./dist`
- `npm start` — `node dist/index.js`
- `npm run db:push` — `drizzle-kit push`, sincroniza schema a Supabase
- `npm run db:generate` — `drizzle-kit generate`, genera SQL de migración
- `npm run auth:generate` — regenera `src/db/schema.ts` desde la config de Better Auth (correr cada vez que se cambien plugins de auth)

### Frontend (`topitop-frontend/`)
- `npm run dev` — Vite dev server en `http://localhost:5173`
- `npm run build` — `tsc -b && vite build` (type-check incluido)
- `npm run lint` — ESLint flat config
- `npm run preview` — preview del build

No hay test runner configurado.

## Stack

### Backend
- **Hono** sobre `@hono/node-server`, con `cors` middleware
- **Better Auth** + plugin `admin` (email+password, sin OAuth)
- **Drizzle ORM** + `pg` driver
- **Supabase Postgres** vía Session Pooler (ver [Gotchas](#gotchas-críticos))
- **Zod 4** para validación de env y cuerpos de request
- **Pino** + `pino-pretty` para logging
- **dotenv** para cargar `.env`

### Frontend
- **Vite 8** + **React 19** + **TypeScript 6**
- **React Router v7** (`createBrowserRouter`)
- **TanStack Query v5** para estado del servidor
- **Better Auth React client** (`useSession`, `authClient.admin.*`)
- **Hono RPC** (`hc<AppType>`) tipado contra el backend vía path alias
- **Tailwind CSS v4** (con `@tailwindcss/vite` plugin, sin `tailwind.config.js`)
- **shadcn/ui** (`new-york` style, icon library `lucide`)
- **react-hook-form** + `@hookform/resolvers/zod`
- **Zustand** para estado UI (`src/stores/`)
- **Sonner** para toasts, **date-fns**, **clsx + tailwind-merge**

## Arquitectura

### Flujo de autenticación
1. Frontend monta cliente Better Auth (`src/lib/auth-client.ts`) apuntando a `VITE_API_URL`
2. Login envía POST a `/api/auth/sign-in/email`; backend setea cookie HttpOnly `SameSite=Lax` con sesión
3. Todo `fetch` desde el frontend usa `credentials: "include"`; el browser envía la cookie automáticamente
4. Backend valida con `auth.api.getSession({ headers })` en el middleware `requireAuth`
5. **El frontend nunca toca tokens** — solo lee `useSession()`, que internamente consulta `/api/auth/get-session`

### Roles y guards
Los 4 roles válidos viven en `src/lib/roles.ts` (definidos en ambos proyectos como constante `ROLES`):
- `admin`, `PIM`, `PRICING`, `ORDER_MANAGEMENT`

Después de login, el frontend redirige según `ROLE_HOME[role]`:
- admin → `/admin/users`
- PIM → `/pim`
- PRICING → `/pricing`
- ORDER_MANAGEMENT → `/orders`

**Guards:**
- Backend: `requireAuth` + `requireRole(...allowed)` (admin pasa siempre)
- Frontend: `<RequireRole roles={[...]}>` envuelve rutas; admin pasa siempre

### Type sharing (Hono RPC)
- Backend exporta `AppType` en [topitop-backend/src/index.ts](topitop-backend/src/index.ts)
- Frontend importa con `import type { AppType } from "@backend/index.js"` y construye el cliente RPC en [topitop-frontend/src/lib/api.ts](topitop-frontend/src/lib/api.ts)
- El alias `@backend/*` está definido en `tsconfig.app.json`, `tsconfig.json` y `vite.config.ts`. Es **type-only** — Vite no incluye nada del backend en el bundle

### Admin plugin de Better Auth
Toda la CRUD de usuarios usa el plugin `admin` (no hay endpoints custom). Ver [topitop-frontend/src/features/admin-users/hooks.ts](topitop-frontend/src/features/admin-users/hooks.ts):
- `authClient.admin.listUsers`, `createUser`, `setRole`, `banUser`, `unbanUser`, `removeUser`

Las mutaciones invalidan la query `["users"]`.

### Layout / diseño
Inspirado en topitop.pe (estructura, no contenido):
- `AnnouncementBar` (top, negro)
- `AppHeader` (sticky, logo + sección + badge rol + dropdown avatar)
- `AppFooter` (negro, 4 columnas)

Componentes en [topitop-frontend/src/components/](topitop-frontend/src/components/). El logo es `/Topitop_2007.webp` (en `public/`), renderizado vía el componente `Logo`.

Token `--brand` (rojo Topitop) en `index.css` para acentos. `--primary` es negro puro.

## Variables de entorno

### Backend [.env](topitop-backend/.env) (gitignored, ver `.env.example`)
```
DATABASE_URL=postgresql://postgres.<ref>:<password-url-encoded>@aws-0-<region>.pooler.supabase.com:5432/postgres
BETTER_AUTH_SECRET=<32+ chars, base64 OK>
BETTER_AUTH_URL=http://localhost:3000
CORS_ORIGIN=http://localhost:5173
NODE_ENV=development
```
Validadas con Zod en [src/env.ts](topitop-backend/src/env.ts).

### Frontend [.env](topitop-frontend/.env)
```
VITE_API_URL=http://localhost:3000
```

## Bootstrap (primera vez)

1. Crear proyecto en Supabase, copiar URL del **Session Pooler** (NO la directa, NO la Transaction — ver Gotchas)
2. Backend: `npm run db:push` → crea tablas Better Auth (`user`, `session`, `account`, `verification`)
3. Crear primer usuario vía POST a `/api/auth/sign-up/email` (curl o Thunder Client). **No hay UI pública de signup** — todos los demás usuarios se crean desde el panel admin
4. Promover a admin manualmente en SQL Editor de Supabase:
   ```sql
   UPDATE "user" SET role = 'admin' WHERE email = '<tu-email>';
   ```
5. Login en frontend → panel admin → crear el resto

## Gotchas críticos

### Supabase: usar Session Pooler, no Direct ni Transaction
- **Direct** (`db.<ref>.supabase.co:5432`) es **IPv6-only por defecto**. Conexión se cuelga en ISPs sin ruta IPv6 (común en Perú).
- **Transaction Pooler** (`pooler.supabase.com:6543`) corta transacciones largas → `drizzle-kit push` se cuelga en "Pulling schema".
- **Session Pooler** (`pooler.supabase.com:5432`) — IPv4 + sesiones largas. Sirve tanto para migraciones como para runtime del app server.

Password en la URL debe estar **URL-encoded** (`@` → `%40`, etc.). Sin corchetes `[]` (esos son placeholders del UI de Supabase).

### Drizzle adapter necesita `schema` explícito
Tanto `drizzle(pool, { schema })` como `drizzleAdapter(db, { provider: "pg", schema })` deben recibir el schema importado. Sin esto, Better Auth tira `The model "user" was not found in the schema object`.

### Schema de Better Auth se regenera, no se edita a mano
[src/db/schema.ts](topitop-backend/src/db/schema.ts) es output de `npm run auth:generate`. Si se añade/quita un plugin de Better Auth (admin, organization, etc.), regenerar y volver a hacer `db:push`.

### TS del backend: `verbatimModuleSyntax` + `NodeNext`
- Imports relativos requieren extensión `.js` (aunque el archivo sea `.ts`): `import { x } from "./foo.js"`
- Tipos puros usan `import type`
- Errores TS de "must have file extension" o "cannot import type without `import type`" → falta uno de los dos

### Admin client del frontend: roles tipados solo como `"user" | "admin"`
El plugin admin del SDK declara `role: "user" | "admin"` en TS. Nuestros 4 roles aceptan strings libres a runtime, pero TS no lo sabe. En `features/admin-users/hooks.ts` se castea `role: input.role as "admin"`. Si se introduce access-control formal (`betterAuth/plugins/access`), se puede tipar correctamente.

### Cookies cross-origin requieren config exacta
- Backend: `cors({ origin: CORS_ORIGIN, credentials: true })` — NO usar `origin: "*"` con credentials
- Frontend: cada `fetch` con `credentials: "include"` (ya cableado en `lib/api.ts`)
- En producción, las cookies necesitan `Secure=true` (HTTPS). Better Auth lo activa al detectar `NODE_ENV=production`.

### Tailwind v4 sin config file
No hay `tailwind.config.js`. Todo (tokens, dark mode, theme inline) vive en [src/index.css](topitop-frontend/src/index.css) con `@theme inline` y `@custom-variant dark`. El plugin Vite es `@tailwindcss/vite`.

### shadcn componentes
Style `new-york`, icon library `lucide`. Para añadir más:
```
npx shadcn@latest add <component> -y
```
Componentes ya instalados: button, input, label, form, table, dialog, dropdown-menu, sonner, avatar, badge, card, sheet, skeleton, select.

## Convenciones

- Path aliases: `@/*` → `src/*` (frontend), `@backend/*` → `../topitop-backend/src/*` (frontend, solo type imports)
- Mensajes de UI en **español** (es-PE)
- Identificadores y código en **inglés**
- Roles como strings UPPER_SNAKE_CASE (excepto `admin`, en lowercase por convención de Better Auth)
- Esquemas Zod compartidos viven en **el frontend** y se replican en el backend cuando es necesario. No hay paquete shared — el contrato real es `AppType` exportado vía Hono RPC.

## Estructura de archivos clave

### Backend
- [src/index.ts](topitop-backend/src/index.ts) — entry, CORS, monta auth handler + rutas, exporta `AppType`
- [src/lib/auth.ts](topitop-backend/src/lib/auth.ts) — `betterAuth()` config
- [src/lib/db.ts](topitop-backend/src/lib/db.ts) — pool + drizzle instance
- [src/db/schema.ts](topitop-backend/src/db/schema.ts) — generado, no editar a mano
- [src/middleware/auth.ts](topitop-backend/src/middleware/auth.ts), [requireRole.ts](topitop-backend/src/middleware/requireRole.ts)
- [src/routes/](topitop-backend/src/routes/) — un archivo por rol con guard incluido

### Frontend
- [src/main.tsx](topitop-frontend/src/main.tsx) — `QueryClientProvider` + `RouterProvider` + `Toaster`
- [src/routes/router.tsx](topitop-frontend/src/routes/router.tsx) — definición central de rutas con `<RequireRole>`
- [src/lib/auth-client.ts](topitop-frontend/src/lib/auth-client.ts), [api.ts](topitop-frontend/src/lib/api.ts), [roles.ts](topitop-frontend/src/lib/roles.ts), [query-client.ts](topitop-frontend/src/lib/query-client.ts)
- [src/components/AppShell.tsx](topitop-frontend/src/components/AppShell.tsx), [AppHeader.tsx](topitop-frontend/src/components/AppHeader.tsx), [AppFooter.tsx](topitop-frontend/src/components/AppFooter.tsx), [AnnouncementBar.tsx](topitop-frontend/src/components/AnnouncementBar.tsx), [Logo.tsx](topitop-frontend/src/components/Logo.tsx)
- [src/components/auth/](topitop-frontend/src/components/auth/) — `RequireAuth`, `RequireRole`
- [src/features/admin-users/](topitop-frontend/src/features/admin-users/) — hooks TanStack Query + schemas Zod para el CRUD
- [src/routes/admin/](topitop-frontend/src/routes/admin/), [pim/](topitop-frontend/src/routes/pim/), [pricing/](topitop-frontend/src/routes/pricing/), [orders/](topitop-frontend/src/routes/orders/)
