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
  - **Mesas**: todas **cuadradas y del mismo tamaño** (`TABLE_SIZE = 12` en `lib/plan.ts`; `w`/`h` se guardan pero siempre valen eso).
    Sueltas para 4; las **pegadas de a dos** son para 3 cada una (un lado contra la otra), así el par sienta 6. `FloorPlan` dibuja las
    sillas solo en los **lados libres** (`touchingSides`: otra mesa a < 0,5 unidades). Plano actual: 11 mesas, 38 lugares, pares 1+2,
    6+7 y 9+10 (`scripts/data/plan.ts` y migración `0002_mesas_cuadradas`). El editor del panel ya no tiene "Forma"; "Agregar mesa"
    agrega una cuadrada de 4.
  - **Opciones de lugar** (`seatingOptions` en `lib/combos.ts`, pura: la usan el sitio y el servidor). Mesa sola o **dos mesas juntas**
    (`COMBO_MAX_TABLES = 2`). Pares **vecinos**: B es la mesa libre más cercana a A en alguna dirección (eje dominante entre centros)
    o al revés, y borde a borde ≤ `NEAR_MAX_GAP = 12`; si no, son **separados** (el local los junta). Sin desperdicio: un par vale si
    `suma − personas < capacidad de la más chica`. Pares vecinos solo si desperdician menos que la mejor mesa sola; separados solo
    si no hay mesa sola. `tier`: `exact` (mesas solas o pares vecinos), `apart` (pares separados) o `none`.
    **Prioridad entre pares** (se usa el primer grupo con opciones; manda la **cercanía**, pedido del cliente):
    1. pares **pegados** que alcanzan; 2. pares **vecinos** (da igual si una de las mesas es mitad de un par pegado);
    3. pares **separados**, por último. Ej. 7 personas con libres el par 1+2, la 5 y la 11 → se ofrece 1+5 / 2+5 (vecinas), no 5+11.
    (Se probó priorizar dos sueltas aunque estuvieran lejos y el cliente prefirió volver a la cercanía.)
    **Pegadas primero** (pedido del cliente): si **algún** par de mesas **pegadas** (`joined`, borde a borde < `JOINED_GAP = 0,5`)
    alcanza para el grupo, **solo se ofrecen pares pegados**: no se arman pares con mesas sueltas (así no se mezclan separadas con juntas).
    Ej.: 5–6 personas → solo 1+2, 6+7, 9+10 (los que estén libres); si no queda ningún par pegado libre, recién ahí se juntan sueltas
    (6+9, 3+4…); con 7 el par pegado no alcanza y se combinan todas.
    **Grupos chicos** (≤ `SMALL_GROUP_MAX = 3`, pedido del cliente: 1, 2 y 3 personas): solo **mesas sueltas** (las de 4) si hay
    alguna libre, aunque una de 3 alcance; las mitades de un par
    pegado libre se guardan para grupos grandes y entran solo si no queda ninguna suelta (si la compañera ya está tomada, esa mesa
    cuenta como suelta). En el plano se ven como "No disponible para P · Te mostramos las que mejor se ajustan a tu grupo"
    (estado `small`; aria "no disponible para este grupo"). Al pasar al
    paso 2, si no hay mesa sola que alcance, la web **elige de entrada** el primer par pegado ("Mesas pegadas · 6 lugares"); se puede cambiar.
    **Tocar una mesa de un par pegado elige las dos de una** (ej. tocar la 1 elige 1 + 2), sin pasar por el cuadro.
    `GET /api/availability` devuelve `tier` + `options`;
    `POST /api/reservations` acepta **solo** una de esas opciones (si no, 400 `code: "unavailable"`, y la web vuelve al paso 2).
  - Dos mesas = una fila por mesa con el mismo `reservations.group_id`; el panel las junta (`collapse` en `lib/admin-data.ts`) y las
    acciones (cancelar, confirmar, llegaron, restaurar) afectan a todo el grupo. No se mueven de mesa: se cancela y se carga otra.
    En el panel, si no son vecinas (`isApart`) se ven con la etiqueta **"Separadas: juntarlas"**.
  - **Flujo web** (`components/site/Reservation.tsx`), 3 pasos + confirmación:
    1. **Día y personas**: tira de días, horario (turno único) y personas, **sin plano**. Aviso de disponibilidad **sin números
       ni detalles** (pedido del cliente), en tarjeta con ícono + texto (no solo color):
       - **verde** (tokens `ok` / `ok-bg`, ✓): "Hay lugar para P personas este día." si hay alguna opción (mesa sola, par o separadas);
       - **roja** (borde `sumeria`, fondo `alert-bg`, X): "No quedan mesas para P este día…" con WhatsApp, y **el botón
         "Ver mesas disponibles" no se muestra**.
       Lo de juntar mesas se explica en el paso 2.
    2. **Mesa**: plano. Mesa sola → se elige al tocarla. Mesa que solo sirve en par → queda como **ancla** (`anchor`) y aparecen
       **cuadros** (`groups` de `FloorPlan`) con cada vecina; tocando el cuadro o la mesa marcada "JUNTAR" (`partner`) se elige el par.
       Los pares separados no llevan cuadro (atravesaría el salón): solo se marca la compañera. Lista "Juntar mesas" sincronizada
       con el ancla (alternativa por teclado/lector).
    3. **Tus datos**.
    En los pasos 2 y 3 hay una **flecha "Volver"** (`BackButton`) además de los links "Cambiar" / "Cambiar mesa".
  - **Días reservables**: `settings.booking_from/booking_to/blocked_dates` (panel → Calendario de reservas). Sin rango: hoy → hoy + 7.
    Regla pura en `lib/booking.ts` (`bookingStatus`). **Corte del mismo día a las 19:30** (`SAME_DAY_CUTOFF`): la web lo muestra con
    botón a WhatsApp y `POST /api/reservations` responde 422 `code: "cutoff"`.
  - Las reservas web entran como `pend`; el local confirma desde el panel (abre `wa.me/549<tel>` con el mensaje y pasa a `conf`).
  - Web: hasta 8 personas. El panel usa `/api/admin/availability` (sin las reglas del sitio).
- **Carta** (`app/(site)/carta/page.tsx` + `CartaFilter` / `CartaSection` en `components/site/CategoryBar.tsx`): filtro sticky
  con **"Todas"** (todas las categorías seguidas) y una opción por categoría (muestra **solo** esa). Al tocar un filtro vuelve al
  principio de la carta (la barra queda pegada al header) y la lista entra con un fundido corto. La categoría va en el hash
  (`/carta#cat-rolls`): los links del inicio y de las novedades abren la carta ya filtrada. La opción activa lleva la X que se
  dibuja trazo por trazo (`NavX`, compartida con el header) en un hueco fijo, así el texto no se mueve. Cuando la barra queda
  pegada al header cambia a fondo `coal` con sombra, para que se note la división entre nav y filtros.
  Botón de agregar (`CartControl`): **sello hanko** como el del header. Sin ítems: "Agregar" + sello punteado rojo con "+"
  (mobile: solo el sello); al agregar el sello se estampa con una onda de tinta y queda − [cantidad en el sello] +. Cada cambio
  vuelve a estampar; si la cantidad viene del pedido guardado, aparece quieto. El foco pasa a "+" al agregar y vuelve a "Agregar" al llegar a 0.
- **Carrito**: estado en `SiteProvider`, persistido en `localStorage` (`sumeria:pedido`). Arma el mensaje exacto del handoff
  (`orderMessage` en `lib/whatsapp.ts`) y abre `wa.me/<whatsapp del local>`.
  En el carrito (`CartDrawer`) cada ítem tiene un botón para **quitarlo** (tacho) y, debajo de la lista, **"Agregar productos"**
  (sello punteado como el de la carta) lleva a `/carta` y cierra el carrito. En delivery, debajo de la dirección, hay
  **"Aclaraciones de la dirección"** (`addressNote`: timbre, portón…; va al mensaje como "Aclaraciones"); la
  **"Nota del pedido"** (los dos modos) va arriba de la sección Entrega.
  **Pago** (entre la nota y Entrega): Efectivo o Transferencia (`payment`); va al mensaje como "Pago: …".
  **De entrada: Efectivo y Take away** (Take away a la izquierda), pedido del cliente.
  Obligatorios: nombre y, en delivery, dirección (sin contar espacios). Aclaraciones y nota dicen "(opcional)". Al tocar
  "Enviar" con un obligatorio vacío, la vista va al primer campo vacío (foco + mensaje debajo del campo, `aria-describedby`)
  y abajo aparece "Faltan datos". **Teclado en mobile** (`useKeyboard`, con `visualViewport`): en iOS el panel sube su borde
  de abajo lo que tapa el teclado; con el teclado abierto se oculta el bloque del total para que no tape el campo, y el campo
  con foco se centra. **Sin zonas de delivery** (pedido del cliente): no hay selector ni costo de envío;
  el mensaje lleva solo el total de los productos. Las zonas siguen en la base, en el panel y en *Nosotros*.
- **Fotos**: `Photo.tsx` pinta siempre el fondo placeholder cálido y encima la foto (`CldImage` si hay `public_id`, si no `next/image`).
  `photo_cutout = true` → la foto (PNG/WebP sin fondo) se muestra entera, sin recortar.
- **Modo sin base** (producción sin `DATABASE_URL`, que es como está hoy en Vercel): `dbConfigured()` en `lib/db.ts` da `false` y
  - `lib/data.ts` devuelve los datos estáticos de `lib/static-data.ts` (carta real, plano, zonas y datos del local, sacados de
    `scripts/data/` igual que el seed; mismos ids, así el carrito guardado sigue valiendo al conectar la base);
  - no hay novedades; `/reservas` muestra "Reservá por WhatsApp"; `/api/availability` y `/api/reservations` responden 503;
  - `/admin/login` y el panel muestran "Falta conectar la base de datos".
  En desarrollo nunca entra en este modo (usa PGlite). **Para activar todo**: crear Neon, `db:migrate` + `db:seed` contra Neon,
  cargar `DATABASE_URL`, `ADMIN_*` y `AUTH_SECRET` en Vercel y redeployar (en ese orden: el build prerenderiza leyendo la base).
- **Hero del inicio** (`components/home/Hero.tsx`): de fondo un video (`HeroVideo`; 1080p en desktop, 720p en mobile): se reproduce
  una vez al entrar (mudo, `playsInline`, sin loop) y queda pausado en el último cuadro. Va a 1,25× (`RATE`) y en el
  último tramo frena (`TAIL`, hasta 0,5×; más lento se ve trabado) para asentarse en la imagen final en vez de cortar.
  Al empezar a frenar, la imagen sigue con un acercamiento lento (`scale-103`, 2 s) y se oscurece (capa negra al 35 %, 2,5 s):
  el movimiento no se corta y el texto gana contraste. (Se descartó un "rebote": Chrome no reproduce video en reversa y
  un rebote de escala se sentía como golpe de cámara.) Igual que la intro del texto, corre una vez
  por carga: al volver al inicio navegando, o con `prefers-reduced-motion`, se muestra directo el último cuadro, ya acercado y oscurecido.
  Texto: "Sushi · Rolls · Salads · Bagels" cae palabra por palabra con rebote (spring, `WORDS_AT` + `WORDS_STAGGER`); recién
  después (`AFTER_WORDS`) entran los CTAs y la línea de datos. CTAs (`HeroCta`): **sello hanko** como el pedido y el "Agregar":
  texto en mayúsculas + sello con flecha (rojo relleno en "Ver la carta", punteado en "Reservar mesa"); al pasar el mouse el
  sello se endereza, la flecha avanza y se dibuja un subrayado rojo. (Historial: antes eran píldoras con `button()`; el cliente
  las encontró genéricas.)
- **"¿Qué pedimos hoy?"** (inicio, `FeaturedReveal` en `components/home/FeaturedReveal.tsx`): al entrar en pantalla sube el
  encabezado (`data-reveal`) y después las tarjetas (`data-rail-item`), escalonadas; arrancan con `opacity-0` en el HTML
  (`motion-reduce:opacity-100!`). En **mobile** se nota que la tira scrollea: tarjetas al 72 % (asoma la siguiente), encastre
  (`snap-x`) y borde derecho desvanecido hasta llegar al final (`data-end`). (Se probó un amague de las tarjetas hacia la
  izquierda y se sacó.)
- **Header** (`components/site/SiteHeader.tsx`, cliente, vive en el layout así que no se remonta al navegar):
  - Botón del pedido (`CartButton`): **sello hanko**. "Pedido" en texto limpio (sin caja) + la cantidad dentro de un cuadradito
    `sumeria-dark`, inclinado −6°, con filete interior blanco (`ring-inset`) como los sellos japoneses; al pasar el mouse se endereza.
    Cada vez que cambia la cantidad el sello "golpea" (entra a escala 1,8 y girado, spring seco). Sin ítems: contorno punteado gris con "0".
    El sello vive en un contenedor fijo de 26 px, así el texto no se mueve. El `aria-label` siempre dice la cantidad.
    Ojo: en Tailwind 4 `rotate-*` usa la propiedad CSS `rotate`, que se **suma** al `transform` de framer-motion; la inclinación en
    reposo va por clase y motion solo anima el giro extra del golpe (termina en 0).
    (Historial: antes fue píldora con ícono de bolsa y después de maki; el cliente las encontró genéricas.)
  - Sección activa (`NavX`): la X roja se dibuja trazo por trazo (largo, después los dos cortos), igual que en el hero pero en ≈ 0,5 s.
    **Los textos de la nav nunca se mueven**: en desktop la X es absoluta a la izquierda del texto (dentro del espacio de 30 px entre
    secciones); en el menú mobile cada sección tiene un hueco fijo de 18 px donde aparece. Con `prefers-reduced-motion` aparece sin animar.
  - Logo (`HeaderLogo`, igual en mobile y desktop): la X es SVG (`LOGO_X` en `components/XMark.tsx`, compartida con el hero) y
    "SUMERIA SU SHI" es el PNG recortado (desde x 150 de 1187). **En el inicio** está oculto mientras el logo grande del hero
    (`[data-hero-logo]`) está a la vista (`useLogoVisible`, IntersectionObserver con el alto del header); al pasarlo entra dibujando
    la X y barriendo el texto. Con el menú mobile abierto se muestra siempre. En el resto de las páginas se ve siempre, sin animación
    de entrada en la primera carga. El link conserva su ancho (146 px) aunque el logo esté oculto, para que la nav no se corra.
    Al pasar el mouse (o con foco de teclado) la X gira 180° y frena, como el loader.
    (Historial: un tiempo el logo mobile fue fijo y sin animación; el cliente pidió volver a esta lógica también en mobile.)
  - Botón del menú mobile (`MenuIcon`): sin texto; dos trazos redondeados (largo arriba, corto abajo, alineados a la derecha) que al
    abrir se cruzan en una X roja (spring). El `aria-label` dice "Abrir menú" / "Cerrar menú".
  - Menú mobile (`MobileMenu`): al abrir baja como una cortina desde el header (`clip-path`) y las secciones suben escalonadas
    (50 ms entre cada una), después el bloque de contacto; al cerrar la cortina sube. Con `prefers-reduced-motion` aparece y se va sin animar.
- **Carrito** (`CartDrawer`): abre y cierra animado con `AnimatePresence`. El fondo se oscurece (0,35 s) y el panel se desliza
  (0,5 s, curva `EASE_SHEET`): en **desktop entra desde la derecha**, en **mobile sube como hoja desde abajo** (`useIsDesktop`, mismo
  corte de 900 px que `d:`). Al cerrar sale por el mismo lado, más rápido (0,3 s). Con `prefers-reduced-motion` no se desliza.
  El botón de cerrar es una cruz simple de trazo fino, sin fondo (**no** el motivo X de la marca).
- **Auth**: `proxy.ts` redirige a `/admin/login` sin sesión (chequeo optimista); `requireAdmin()` revalida en cada página y acción.

---

## 6. Decisiones tomadas (no las cambies sin hablarlo)

- **Contenido real**: carta tomada del PDF del menú (7 categorías, 69 productos, precios reales, fotos extraídas).
  Los combinados con varios tamaños son un producto por tamaño. El PDF no marca sin TACC: se marca desde el panel.
- **Manual de marca > prototipo**: rojo "Naranja salmón" `#D75B4B` (`sumeria`); rellenos con texto blanco en `sumeria-dark` `#BF4636`
  por contraste. La X imita el símbolo del logo (trazo en S + dos cortos).
- **Tipografías**: el manual pide Grafik Poster RND y Granat (licencia paga, no las tenemos). Se usan las del prototipo, que
  coinciden con el README (verificado 27/10/2026): Oswald (`font-display`), Instrument Sans (`font-sans`), IBM Plex Mono (`font-mono`),
  Mrs Saint Delafield (`font-script`). Extra: Jost 300 (`font-jost`), solo para el "SU SHI" del logo en el hero.
  Para cambiarlas: `next/font/local` en `app/layout.tsx` manteniendo las variables `--font-oswald`, `--font-instrument`, etc.
- Los rótulos "Foto · …" del prototipo no se muestran en producción; sin foto queda el fondo placeholder.
- Agregados al modelo del handoff: `categories.visible/featured`, `events.event_date/when_label/cta_label/cta_target`,
  `tables.location`, `products.placeholder/photo_cutout/photo_url`, `settings.city/instagram`.
- La barra de prototipo (Mobile/Desktop, presets por hash) **no se implementa** (lo dice el handoff).
- **Mesas** (pedido del cliente, 27/10/2026): solo cuadradas y del mismo tamaño; pares pegados de 3 + 3. Grupos que no entran en una
  mesa juntan dos (primero vecinas; si no queda ninguna, separadas). La reserva tiene 3 pasos y el plano está solo en el paso 2.
  La distribución actual es una propuesta: se ajusta desde *Plano del local*.

---

## 7. Estado actual

**Hecho y probado**: sitio completo (inicio, carta con filtro por categoría, carrito → WhatsApp, novedades con filtros, reserva en 4 pasos
con plano interactivo, nosotros con mapa), panel completo (login, inicio, reservas lista/plano con todas las acciones, carga manual,
walk-ins, productos con editor y vista previa, categorías con orden/visibilidad/inicio, eventos con vista previa, editor de plano
con drag y flechas, datos del local), APIs, migraciones, seed con la carta real.
`typecheck`, `lint` y `build` pasan.

**Deploy actual**: Vercel en **modo sin base** (sin Neon todavía): carta y pedidos por WhatsApp funcionan; reservas online y panel, no.

**Infra (27/10/2026)**: base Neon creada y conectada. Migraciones aplicadas (`db:migrate`) y datos ya cargados
(7 categorías, 69 productos, 8 mesas, 3 zonas, 1 fila de settings; sin novedades ni reservas). `.env.local` tiene `DATABASE_URL`,
`ADMIN_EMAIL` y `AUTH_SECRET`. En Vercel están `DATABASE_URL` y `ADMIN_EMAIL`.
`ADMIN_PASSWORD` es **provisoria** (débil, a propósito, hasta el lanzamiento oficial): **cambiarla por una fuerte
(≥ 14 caracteres) en Vercel y en `.env.local` antes de lanzar**, y redeployar. No escribir nunca la clave en este archivo (repo público).
Pendiente: `AUTH_SECRET` propio de producción en Vercel (confirmar), redeploy.
**Cloudinary se deja para después**: sin credenciales las fotos salen de `public/menu/`. Al configurarlo hay que subir las fotos
desde el panel, porque `db:seed` no pisa datos existentes (solo con `-- --force`, que borra y recarga).


## 8. Próximos pasos (en orden sugerido)

0. **Pedido del cliente, pospuesto**: **silla extra** en reservas (ej. mesa de 4 para 5 personas): hasta 1 silla extra por mesa,
   ofrecida **solo si no hay otra opción justa**, mesa marcada "+1 silla" en el plano y aviso "agregar 1 silla" en el panel
   (se puede derivar de `personas − capacidad`, sin columna nueva). Encaja como un escalón más en `seatingOptions`.

1. **Infra**: crear proyecto en Neon y en Vercel, cargar las variables (§4), `npm run db:migrate && npm run db:seed` contra Neon
   (con Cloudinary configurado, el seed sube las fotos y guarda los `public_id`).
2. **Anti-spam en reservas**: hoy `POST /api/reservations` no tiene límite. Agregar rate limit por IP (p. ej. Upstash/Vercel KV) y/o honeypot.
3. **Protección del login**: limitar intentos (hoy solo hay un retardo de 400 ms).
4. **Aviso al local de reservas nuevas** (hoy solo se ven en el panel): notificación por WhatsApp/email o badge en tiempo real.
5. **Contenido del cliente**: el hero usa video (`HeroVideo` en `components/home/Hero.tsx`, 5,8 s, 25 fps, sin audio):
   `public/fotos/hero-1080.mp4` (2,6 MB) en desktop y `hero-720.mp4` (0,9 MB) en mobile, con `<source media>`. Salen del
   original 1920×1080 (en `info_web/fotos/`, 7 MB) con
   `ffmpeg -i original.mp4 -an -c:v libx264 -preset veryslow -crf 23 -pix_fmt yuv420p -movflags +faststart hero-1080.mp4`
   (el de 720: `-vf scale=1280:720:flags=lanczos -crf 24`). `+faststart` hace que arranque antes de bajarse entero.
   Si se reemplaza, guardarlo con **otro nombre** (cachea por URL). Para recomprimir hace falta ffmpeg (`winget install Gyan.FFmpeg`; se desinstaló después de usarlo).
   Faltan fotos de nosotros, delivery y galería "Así lo disfrutan", logo SVG, archivos de tipografías,
   horarios de cierre, zonas y costos de envío reales (estos últimos se cargan desde *Datos del local*).
6. **Galería de Instagram** del inicio: hoy son placeholders; definir si se carga desde el panel o desde la API de Instagram.
7. **Tests**: e2e con Playwright para el mensaje del carrito, el flujo de reserva (incluido el 409) y el login del panel.
8. **Limpieza de Cloudinary**: al reemplazar o quitar una foto no se borra el asset viejo.
9. Menor: warning de Node al cargar `tailwind.config.ts` como ESM (inofensivo); recuperar contraseña del panel (hoy: "pedila a DunkCode").
