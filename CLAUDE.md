# Sumeria Sushi · web

Sitio público y panel de administración de **Sumeria Sushi** (25 de Mayo 181, Concepción del Uruguay, Entre Ríos).
Desarrollado por **DunkCode**. Este archivo es el contexto de trabajo: leelo entero antes de tocar código.

- `README.md` → handoff original de diseño (especificación funcional y visual). **No lo modifiques**: es la fuente de verdad del diseño.
- `CLAUDE.md` (este archivo) → estado del proyecto, reglas y próximos pasos.
- `AGENTS.md` → reglas de Next.js para agentes (lo regenera `next dev`, no lo borres).

@AGENTS.md

---

## 1. Reglas obligatorias

### Git: SIEMPRE con la cuenta `dunk-codee`

Todo commit y todo push se hacen **únicamente** con la cuenta de GitHub **`dunk-codee`** (`dunk.codee@gmail.com`).
Nunca con cuentas personales.

Antes de cada commit/push verificá:

```bash
git config user.name      # tiene que decir: dunk-codee
git config user.email     # tiene que decir: dunk.codee@gmail.com
git remote get-url origin # tiene que decir: https://dunk-codee@github.com/dunk-codee/sumeria-web.git
```

El usuario `dunk-codee@` en la URL del remoto hace que Git Credential Manager use siempre esa cuenta para el push,
aunque haya otras cuentas guardadas en la máquina. Si algo no coincide:

```bash
git config user.name "dunk-codee"
git config user.email "dunk.codee@gmail.com"
git remote set-url origin https://dunk-codee@github.com/dunk-codee/sumeria-web.git
git credential-manager github list   # dunk-codee tiene que aparecer; si no: git credential-manager github login
```

- **No uses `gh auth setup-git`**: hace que git use la cuenta activa de `gh`, que puede no ser `dunk-codee`.
  Si usás `gh` para PRs, verificá antes con `gh auth status` que la cuenta activa sea `dunk-codee` (`gh auth switch -u dunk-codee`).
- Después de pushear, confirmá en GitHub que el commit figura con autor `dunk-codee`.
- Remoto: `https://github.com/dunk-codee/sumeria-web`  (**público**: nunca subas credenciales ni material privado del cliente).
- Rama principal: `main`.
- Trabajá en ramas (`feat/...`, `fix/...`) y abrí PR contra `main`. No hagas force-push a `main`.
- Mensajes de commit en español, en imperativo y concretos: `Agrega límite de reservas por IP`, `Corrige total del carrito con envío`.
- Nunca commitees `.env*` (salvo `.env.example`), `.data/` ni `node_modules/`.
- Antes de commitear: `npm run typecheck && npm run lint && npm run build` (el build necesita la base, ver §4).

### Código

- **Todo en español** de cara al usuario: textos de UI, mensajes de error, comentarios del código. Identificadores en inglés.
  Español rioplatense (voseo): "Armá tu pedido", "Reservá tu mesa", "Completá tu nombre". Con tildes y ñ siempre.
- **Next.js 16.4 con Cache Components**: no es el Next que conocés. Antes de usar una API leé la doc incluida en
  `node_modules/next/dist/docs/`. Cosas clave:
  - `middleware.ts` ahora es **`proxy.ts`**.
  - Datos cacheados con `"use cache"` + `cacheLife` + `cacheTag`. Datos en tiempo real dentro de `<Suspense>` o detrás de un runtime API.
  - En Server Actions usá **`updateTag(tag)`** (no `revalidateTag` sin perfil) y `refresh()` para refrescar el router.
  - `error.tsx` recibe `retry` (no `reset`).
  - `new Date()` / `Math.random()` en render requieren `connection()` o un runtime API antes (en el panel, `requireAdmin()` ya lo hace).
  - Un archivo `"use client"` **no puede exportar helpers** que use el servidor (por eso `components/admin/styles.ts` está separado de `ui.tsx`).
- **Estilos solo con Tailwind** usando los tokens de `tailwind.config.ts` (`ink`, `bone`, `sumeria`, `kraft`, `stone-*`, `panel-*`, `smoke-*`).
  No uses estilos inline salvo valores dinámicos (posiciones del plano, fondos placeholder). No agregues colores sueltos.
- Variantes de componentes con `cva` (`components/ui.tsx`, `components/admin/styles.ts`).
- **Accesibilidad** (del handoff): targets táctiles ≥ 44 px, `aria-label` en mesas, estados **nunca solo por color**
  (borde + relleno + etiqueta), contraste de texto ≥ 4.5:1. Por eso los botones rojos con texto blanco usan `sumeria-dark`, no `sumeria`.
- Motivo X: **un solo uso por bloque**, nunca como fondo repetido (`components/XMark.tsx`).
- Responsive: mobile-first, fluido de 360 a 1440 px. Corte mobile/desktop en **900 px** (breakpoint `d:`).
  El plano de mesas es vertical en mobile y horizontal en desktop.
- Validá toda entrada del servidor con **zod**. Toda Server Action del panel empieza con `await requireAdmin()`.
- Cambios de esquema: editá `lib/schema.ts` → `npm run db:generate` → revisá el SQL generado en `drizzle/` → `npm run db:migrate`.
  **Nunca edites una migración ya aplicada**; creá una nueva.
- `info_web/` es material del cliente (prototipos HTML, PDFs del menú y manual, logos, foto original del hero). Es solo referencia:
  no se modifica ni se importa desde la app. **No está en el repo** (está en `.gitignore` porque el repo es público):
  pedíselo a DunkCode y copialo en la raíz del proyecto.

---

## 2. Tecnologías

| Área | Tecnología | Versión | Notas |
| --- | --- | --- | --- |
| Framework | **Next.js** (App Router, TypeScript) | 16.4.3 | Cache Components + Partial Prefetching activados, Turbopack |
| UI | **React** | 19.3 | Server Components + Server Actions |
| Lenguaje | **TypeScript** | 5 | `strict` |
| Estilos | **Tailwind CSS** | 4 | Config en `tailwind.config.ts` vía `@config` en `app/globals.css` |
| Variantes | **class-variance-authority** (`cva`) | 0.7 | |
| Base de datos | **Neon** (Postgres serverless) | — | `@neondatabase/serverless` (WebSocket, soporta transacciones) |
| Base local | **PGlite** (`@electric-sql/pglite`) | 0.5 | Postgres embebido cuando no hay `DATABASE_URL` (solo desarrollo) |
| ORM | **Drizzle ORM** + **drizzle-kit** | 0.45 / 0.31 | Migraciones versionadas en `drizzle/` |
| Validación | **zod** | 4 | |
| Imágenes | **Cloudinary** (`cloudinary`, `next-cloudinary`) | 2 / 7 | Upload Widget con subida firmada, `CldImage` con `f_auto,q_auto` |
| Auth panel | **jose** (JWT HS256 en cookie httpOnly) | 6 | Usuario/contraseña por variables de entorno |
| Fuentes | `next/font/google` | — | Oswald, Instrument Sans, IBM Plex Mono, Mrs Saint Delafield |
| Scripts | **tsx**, **dotenv** | — | `scripts/migrate.ts`, `scripts/seed.ts` |
| Lint | ESLint 9 + `eslint-config-next` | — | |
| Deploy | **Vercel** + **Neon** | — | Node ≥ 22 |

---

## 3. Estructura

```
app/
  layout.tsx                 fuentes, metadata, <html lang="es-AR">
  globals.css                Tailwind + utilidades (px-gutter, bg-dots, no-scrollbar…)
  icon.svg                   favicon con la X
  (site)/                    sitio público (layout con header, footer, carrito, menú mobile)
    page.tsx                 inicio
    carta/                   carta + loading.tsx (skeleton) + error.tsx (reintentar)
    novedades/  reservas/  nosotros/
  admin/
    actions.ts               TODAS las Server Actions del panel (login, reservas, productos, categorías, eventos, plano, local)
    login/                   ingreso
    (panel)/                 shell con sidebar + loading.tsx
      page.tsx               inicio (stats, pendientes, reservas de hoy)
      reservas/ productos/ productos/[id]/ (id = "nuevo" para crear) categorias/ eventos/ plano/ local/
  api/
    menu/ events/            GET públicos (cacheados)
    availability/            GET ?date&turn&people (siempre fresco)
    reservations/            POST (zod + transacción + 409)
    admin/upload-sign/       POST firma para Cloudinary (requiere sesión)
components/
  ui.tsx  XMark.tsx  Photo.tsx  CloudImage.tsx  FloorPlan.tsx
  site/                      SiteProvider (estado del carrito), SiteHeader, CartDrawer, CartControl, ProductCard,
                             CategoryBar, EventCard, EventsBoard, Reservation, tableStyles
  admin/                     ui.tsx (cliente: Toast, Switch…), styles.ts (clases, sin "use client"), editores y tablas
lib/
  schema.ts                  modelo Drizzle (fuente de verdad de la base)
  db.ts                      conexión (Neon o PGlite) + isUniqueViolation
  data.ts                    lecturas públicas cacheadas con tags: menu, events, plan, settings
  admin-data.ts              lecturas del panel (sin caché)
  availability.ts            regla de disponibilidad de mesas
  auth.ts  session.ts        sesión del panel (session.ts sin dependencias de Node: lo usa proxy.ts)
  whatsapp.ts                mensaje del pedido, mensaje de confirmación de reserva, wa.me
  dates.ts                   fechas en hora argentina (ISO "YYYY-MM-DD")
  turns.ts                   turnos de reserva y límites
  validation.ts  plan.ts  placeholders.ts  format.ts  hours.ts  events.ts  defaults.ts  cloudinary.ts
proxy.ts                     protege /admin y /api/admin
drizzle/                     migraciones SQL generadas
scripts/                     migrate.ts, seed.ts, data/menu.ts (carta real)
public/menu/                 61 fotos de producto extraídas del PDF del menú (WebP sin fondo)
public/brand/                logos PNG (del manual)
info_web/                    material del cliente (solo referencia, fuera del repo)
```

---

## 4. Cómo correrlo

```bash
npm install
cp .env.example .env.local     # completar ADMIN_PASSWORD y AUTH_SECRET (y DATABASE_URL / CLOUDINARY_* si los tenés)
npm run db:migrate
npm run db:seed:demo           # carta real + novedades y reservas de ejemplo
npm run dev                    # http://localhost:3000  ·  panel: /admin
```

**Sin `DATABASE_URL` se usa PGlite** en `.data/pglite`. PGlite admite **un solo proceso**:
pará `npm run dev` antes de correr `db:seed` o `next build`. Para hacer el build local con PGlite: `SUMERIA_ALLOW_PGLITE=1 npm run build`.

| Script | Qué hace |
| --- | --- |
| `dev` / `build` / `start` | Next.js |
| `typecheck` / `lint` | Chequeos (correlos antes de cada commit) |
| `db:generate` | Genera migración desde `lib/schema.ts` |
| `db:migrate` | Aplica migraciones (Neon si hay `DATABASE_URL`, si no PGlite) |
| `db:seed` | Carta real, plano, zonas, datos del local. No pisa datos existentes salvo `-- --force` |
| `db:seed:demo` | Igual + novedades y reservas de ejemplo (fechas relativas a hoy) |
| `db:studio` | Drizzle Studio |

### Variables de entorno (`.env.example`)

| Variable | Uso |
| --- | --- |
| `DATABASE_URL` | Conexión a Neon. **Sin ella en producción el sitio corre en "modo sin base"** (ver §5). Con ella, tiene que estar disponible también en el build |
| `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | Fotos. `next.config.ts` expone cloud name y api key como `NEXT_PUBLIC_*` |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Acceso al panel |
| `AUTH_SECRET` | Firma de la cookie (≥ 32 caracteres) |

---

## 5. Cómo funciona (lo importante)

- **Caché y revalidación**: el sitio lee con `getMenu`, `getEvents`, `getSettings`, `getPlan` (`lib/data.ts`), cacheadas con tags.
  Cada Server Action del panel llama `updateTag(...)` del tag que corresponde → el sitio se actualiza sin redeploy.
  Las novedades usan `cacheLife("hours")` para respetar publicación/vencimiento.
  **Si agregás una lectura pública nueva, ponele tag; si agregás una mutación, expirá el tag.**
- **Reservas**:
  - Estados: `pend` (pendiente) · `conf` (confirmada) · `canc` (cancelada) · `occ` (ocupada sin reserva / walk-in).
  - **Turno único** (`lib/turns.ts`, `TURN`: 20:00 a 23:00). La columna `reservations.turn` se conserva y vale siempre 0; la
    disponibilidad mira solo la fecha (cuentan también las reservas viejas del segundo turno).
  - Una mesa está libre para una fecha si no tiene reserva `pend`/`conf`/`occ`.
  - Índice único parcial `(date, turn, table_n) WHERE status <> 'canc'` + chequeo previo en la transacción. `POST /api/reservations`
    responde **409** si una mesa ya fue tomada. Al restaurar o mover una reserva también se valida.
  - **Mesas combinadas** (`lib/combos.ts`): hasta 3 mesas contiguas (borde a borde ≤ 8 unidades del plano), sin desperdicio y solo si
    sobran menos lugares que con la mejor mesa libre. Una fila por mesa con el mismo `reservations.group_id`; el panel las junta
    (`collapse` en `lib/admin-data.ts`) y las acciones (cancelar, confirmar, llegaron, restaurar) afectan a todo el grupo.
    Una reserva combinada no se mueve de mesa: se cancela y se carga otra.
  - **Días reservables**: `settings.booking_from/booking_to/blocked_dates` (panel → Calendario de reservas). Sin rango: hoy → hoy + 7.
    Regla pura en `lib/booking.ts` (`bookingStatus`). **Corte del mismo día a las 19:30** (`SAME_DAY_CUTOFF`): la web lo muestra con
    botón a WhatsApp y `POST /api/reservations` responde 422 `code: "cutoff"`.
  - Las reservas web entran como `pend`; el local confirma desde el panel (abre `wa.me/549<tel>` con el mensaje y pasa a `conf`).
  - Web: hasta 8 personas. El panel usa `/api/admin/availability` (sin las reglas del sitio).
- **Carrito**: estado en `SiteProvider`, persistido en `localStorage` (`sumeria:pedido`). Arma el mensaje exacto del handoff
  (`orderMessage` en `lib/whatsapp.ts`) y abre `wa.me/<whatsapp del local>`.
- **Fotos**: `Photo.tsx` pinta siempre el fondo placeholder cálido y encima la foto (`CldImage` si hay `public_id`, si no `next/image`).
  `photo_cutout = true` → la foto (PNG/WebP sin fondo) se muestra entera, sin recortar.
- **Modo sin base** (producción sin `DATABASE_URL`, que es como está hoy en Vercel): `dbConfigured()` en `lib/db.ts` da `false` y
  - `lib/data.ts` devuelve los datos estáticos de `lib/static-data.ts` (carta real, plano, zonas y datos del local, sacados de
    `scripts/data/` igual que el seed; mismos ids, así el carrito guardado sigue valiendo al conectar la base);
  - no hay novedades; `/reservas` muestra "Reservá por WhatsApp"; `/api/availability` y `/api/reservations` responden 503;
  - `/admin/login` y el panel muestran "Falta conectar la base de datos".
  En desarrollo nunca entra en este modo (usa PGlite). **Para activar todo**: crear Neon, `db:migrate` + `db:seed` contra Neon,
  cargar `DATABASE_URL`, `ADMIN_*` y `AUTH_SECRET` en Vercel y redeployar (en ese orden: el build prerenderiza leyendo la base).
- **Auth**: `proxy.ts` redirige a `/admin/login` sin sesión (chequeo optimista); `requireAdmin()` revalida en cada página y acción.

---

## 6. Decisiones tomadas (no las cambies sin hablarlo)

- **Contenido real**: carta tomada del PDF del menú (7 categorías, 69 productos, precios reales, fotos extraídas).
  Los combinados con varios tamaños son un producto por tamaño. El PDF no marca sin TACC: se marca desde el panel.
- **Manual de marca > prototipo**: rojo "Naranja salmón" `#D75B4B` (`sumeria`); rellenos con texto blanco en `sumeria-dark` `#BF4636`
  por contraste. La X imita el símbolo del logo (trazo en S + dos cortos).
- **Tipografías**: el manual pide Grafik Poster RND y Granat (licencia paga, no las tenemos). Se usan las del prototipo.
  Para cambiarlas: `next/font/local` en `app/layout.tsx` manteniendo las variables `--font-oswald`, `--font-instrument`, etc.
- Los rótulos "Foto · …" del prototipo no se muestran en producción; sin foto queda el fondo placeholder.
- Agregados al modelo del handoff: `categories.visible/featured`, `events.event_date/when_label/cta_label/cta_target`,
  `tables.location`, `products.placeholder/photo_cutout/photo_url`, `settings.city/instagram`.
- La barra de prototipo (Mobile/Desktop, presets por hash) **no se implementa** (lo dice el handoff).

---

## 7. Estado actual

**Hecho y probado**: sitio completo (inicio, carta con scroll-spy, carrito → WhatsApp, novedades con filtros, reserva en 4 pasos
con plano interactivo, nosotros con mapa), panel completo (login, inicio, reservas lista/plano con todas las acciones, carga manual,
walk-ins, productos con editor y vista previa, categorías con orden/visibilidad/inicio, eventos con vista previa, editor de plano
con drag y flechas, datos del local), APIs, migraciones, seed con la carta real.
`typecheck`, `lint` y `build` pasan.

**Deploy actual**: Vercel en **modo sin base** (sin Neon todavía): carta y pedidos por WhatsApp funcionan; reservas online y panel, no.


## 8. Próximos pasos (en orden sugerido)

1. **Infra**: crear proyecto en Neon y en Vercel, cargar las variables (§4), `npm run db:migrate && npm run db:seed` contra Neon
   (con Cloudinary configurado, el seed sube las fotos y guarda los `public_id`).
2. **Anti-spam en reservas**: hoy `POST /api/reservations` no tiene límite. Agregar rate limit por IP (p. ej. Upstash/Vercel KV) y/o honeypot.
3. **Protección del login**: limitar intentos (hoy solo hay un retardo de 400 ms).
4. **Aviso al local de reservas nuevas** (hoy solo se ven en el panel): notificación por WhatsApp/email o badge en tiempo real.
5. **Contenido del cliente**: el hero usa `public/fotos/hero-sushi.jpg` (1942×809; original en `info_web/fotos/`).
   Lo ideal sería ~3840×1600 para pantallas retina; si llega una versión más grande, guardarla con **otro nombre**
   (las imágenes optimizadas se cachean por URL) y actualizar el `src` en `app/(site)/page.tsx`.
   Faltan fotos de nosotros, delivery y galería "Así lo disfrutan", logo SVG, archivos de tipografías,
   horarios de cierre, zonas y costos de envío reales (estos últimos se cargan desde *Datos del local*).
6. **Galería de Instagram** del inicio: hoy son placeholders; definir si se carga desde el panel o desde la API de Instagram.
7. **Tests**: e2e con Playwright para el mensaje del carrito, el flujo de reserva (incluido el 409) y el login del panel.
8. **Limpieza de Cloudinary**: al reemplazar o quitar una foto no se borra el asset viejo.
9. Menor: warning de Node al cargar `tailwind.config.ts` como ESM (inofensivo); recuperar contraseña del panel (hoy: "pedila a DunkCode").
