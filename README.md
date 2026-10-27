# Handoff: Sumeria Sushi — sitio público + panel de admin

## Overview
Sitio mobile-first para Sumeria Sushi (25 de Mayo 181, Concepción del Uruguay) y su panel de administración.
- **Sitio público**: inicio, carta por categoría, carrito con envío del pedido por WhatsApp, novedades/promos/sorteos, reserva de mesa con plano interactivo, contacto.
- **Panel**: login, inicio (reservas de hoy), reservas (lista + plano), productos (+ editor con vista previa), categorías, eventos/promos, editor del plano (drag), datos del local.
- **Sistema**: `Sumeria Sistema` documenta colores, tipografía, motivo X, botones, tags y estados vacío/cargando/error.

## About the Design Files
Los archivos en `reference/` son **referencias de diseño hechas en HTML** (prototipos con el aspecto y comportamiento previstos), **no código de producción para copiar**. La tarea es **recrearlos con el stack definido abajo**.

## Stack obligatorio
- **Next.js** (App Router, TypeScript) + **React**. Rutas: `/` (inicio), `/carta`, `/novedades`, `/reservas`, `/nosotros` y `/admin/*` (protegido por middleware).
- **Tailwind CSS** para todo el estilo (el prototipo usa estilos inline: traducirlos a clases utilitarias y a `theme.extend` con los tokens de abajo; no copiar los estilos inline).
- **Neon** (Postgres serverless) como base de datos. ORM sugerido: **Drizzle** (o Prisma) con `@neondatabase/serverless`; variable `DATABASE_URL`. Migraciones versionadas + script de seed.
- **Cloudinary** para todas las fotos (productos, eventos, logo, galería): subida desde el panel (Upload Widget o subida firmada desde un Route Handler), guardar `public_id` + `secure_url` en la base, servir con `next-cloudinary`/`CldImage` (`f_auto,q_auto`, `c_fill` con aspecto fijo por tarjeta). Variables: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`.
- Auth del panel: **Auth.js (credentials)** o contraseña de admin con cookie de sesión firmada; solo las rutas `/admin` y `/api/admin/*` la requieren.
- Mutaciones con Server Actions o Route Handlers; el sitio público usa Server Components con `revalidateTag` al editar desde el panel (así los cambios de carta, eventos y plano se ven en el sitio sin redeploy).
- Deploy sugerido: Vercel + Neon.

### Contenido que aporta el cliente (reemplaza los placeholders)
- **Menú real** (categorías, productos, descripciones, piezas, precios, sin TACC, disponibilidad): cargarlo vía script de seed (CSV/JSON → `categories`/`products`) en lugar de los datos de ejemplo del prototipo. Los precios del prototipo son ficticios.
- **Manual de marca**: tiene prioridad sobre los tokens de este README. Si difiere (colores, tipografías, usos del logo/X), actualizar `tailwind.config` y las fuentes (`next/font`). Logo en vectorial (SVG) desde el manual.
- Zonas/precios de envío, horarios, WhatsApp y fotos reales: se cargan desde el panel (`Datos del local`, productos, eventos) una vez desplegado.

### Tailwind — configuración base
```ts
// tailwind.config.ts (extend)
colors: {
  ink: '#0B0A09', coal: '#141210', page: '#1A1918',
  bone: '#F4F1EC', stone: { 2: '#BDB6AD', 3: '#A39B91', 4: '#7E7770' },
  sumeria: { DEFAULT: '#E0302F', light: '#FF6B66', dark: '#C4252B' },
  kraft: { DEFAULT: '#D8BC93', ink: '#21170E' },
  line: 'rgba(244,241,236,.22)',
},
fontFamily: {
  display: ['Oswald', 'sans-serif'],
  sans: ['Instrument Sans', 'system-ui', 'sans-serif'],
  mono: ['IBM Plex Mono', 'monospace'],
  script: ['Mrs Saint Delafield', 'cursive'],
},
keyframes: { 'x-spin': { '0%': { transform: 'rotate(0)' }, '100%': { transform: 'rotate(180deg)' } }, 'x-pulse': { '0%,100%': { opacity: '.35' }, '50%': { opacity: '.75' } } }
```
Estados de mesa y tags (`ST`, `TSTY`, `TYPES` en los scripts) → variantes de componente (`cva`/clases condicionales), siempre combinando borde + relleno + etiqueta, no solo color.

### Estructura sugerida
```
app/(site)/{page,carta,novedades,reservas,nosotros}
app/admin/{login,reservas,productos,categorias,eventos,plano,local}
app/api/{menu,events,availability,reservations,upload-sign}
components/{FloorPlan,Cart,ProductCard,EventCard,StatusTag,XMark}
lib/{db.ts,schema.ts,cloudinary.ts,whatsapp.ts,availability.ts}
drizzle/ · scripts/seed.ts
```
Los `.dc.html` se abren directo en el navegador (necesitan `support.js` y `assets/` al lado). Cada archivo contiene al final un `<script data-dc-script>` con **todos los datos de ejemplo y la lógica** (constantes `CATS`, `PRODUCTS`, `ZONES`, `EVENTS`, `TABLES`, `FIXTURES`, `RES0`, etc.): úsalos como seed y como especificación de comportamiento. El estilo es inline en el marcado.

## Fidelity
**Alta fidelidad (hifi)**: colores, tipografía, espaciados e interacciones finales. Recrear fiel al píxel. Excepciones: menú, precios, zonas, eventos y nombres de clientes son **contenido de ejemplo**; las fotos son **placeholders** (degradados `PH` en el script) a reemplazar por fotografía real; el logo actual (150px) debe reemplazarse por versión vectorial/alta resolución.

## Design Tokens
**Colores**
- Fondo negro `#0B0A09` · superficie `#141210` / `#0E0D0B` / `#191714` · fondo de página `#1A1918`
- Texto `#F4F1EC` (blanco cálido) · secundario `#BDB6AD` · terciario `#A39B91` · apagado `#7E7770` / `#8A837B`
- Rojo marca `#E0302F` (hover/claro `#FF6B66`, oscuro `#C4252B`, `#A3181D`)
- Kraft `#D8BC93` (texto sobre kraft `#21170E`) · `#D9D3CB`
- Líneas: `rgba(244,241,236,.18–.28)`; bordes de panel `#3A3532`, `#2C2826`
- Panel: texto `#F1EEE9`, invertido `#0F0E0D`, ocupado `#34302D`/`#4A4440`
- Links: color `#F4F1EC`, hover `#E0302F`, sin subrayado

**Tipografía** (Google Fonts)
- `Oswald` 400–700: titulares, condensada, mayúsculas
- `Instrument Sans` 400–700 (+ italic 700): cuerpo y UI
- `IBM Plex Mono` 400/500: datos, etiquetas, números de turno/paso
- `Mrs Saint Delafield`: acento manuscrito (uso puntual)

**Radios**: mesas redondas `50%`, resto `3px`/`2px`; mobile frame `34px` (solo prototipo). **Sombras**: prácticamente ninguna; jerarquía por líneas y contraste.
**Motivo X** (de la marca): marcadores de categoría, separadores, loader (`sx-spin` 0→180° ; `sx-pulse` opacidad .35↔.75 para skeletons).
**Fondos de foto placeholder**: `madera`, `pizarra`, `negro`, `makisu`, `kraft` (ver `PH` en el script) + trama diagonal `STR`.

## Sitio público — pantallas
Navegación: Inicio · Carta · Novedades · Reservas · Nosotros; carrito accesible desde cualquier pantalla. Mobile 390px (menú hamburguesa "MENÚ/CERRAR"), desktop con barra superior. Deep link por hash `#m|d/<preset>` solo para el prototipo (la barra de prototipo NO se implementa).
1. **Inicio**: hero con logo, CTAs a Carta y Reservar, "estrellas" (Rolls, Bagels, Woks, Ensaladas, Tablas) como accesos directos a categorías, avance de novedades, datos de contacto.
2. **Carta**: chips de categoría sticky (resaltan al scrollear; clic = scroll suave con offset 112px). Producto: foto, nombre, descripción, piezas (`pcsLabel`), precio `$13.900` (es-AR), marca sin TACC (`gf`), botón Agregar → stepper −/＋. Producto no disponible (`off`): gris, `grayscale(1) brightness(.55)`, sin botón. Estados: ok / cargando (skeleton) / error (reintentar).
3. **Carrito** (panel lateral/hoja): ítems con stepper y nota por ítem, nota general, modo **Delivery / Take away**, zona de envío (Z1 $1.500, Z2 $2.500, Z3 $3.500), nombre (obligatorio), dirección (obligatoria solo en delivery). Validación al primer intento de envío (`tried`). Botón envía a `https://wa.me/<número>?text=` con el mensaje:
```
¡Hola Sumeria! Quiero hacer este pedido:

• 2 × Roll salmón y palta (10 piezas) — $27.800
   Nota: sin sésamo

Subtotal: …
Envío (Zona 1 · Centro): …
Total: …

Entrega: Delivery | Take away (retiro en 25 de Mayo 181)
Nombre: …
Dirección: …
Nota: …
```
   Estado vacío con enlace a la carta.
4. **Novedades**: filtros Todo/Eventos/Promos/Sorteos/Novedades. Tarjeta con fecha (día + mes), tag por tipo (`TYPES`: Evento borde blanco; Promo relleno rojo; Sorteo kraft; Novedad borde punteado), título, descripción, CTA (`go`: ig → instagram.com/sumeriasushi, carta/categoría, reserva). Estado vacío.
5. **Reserva** (4 pasos: 01 Día y personas · 02 Mesa · 03 Tus datos · confirmación):
   - Siempre se muestra el plano con disponibilidad ("N mesas libres · M lugares") y se actualiza al cambiar día/turno/personas.
   - Día: próximos días (`resDate` offset desde hoy). Turnos: 1° 20:00–21:45, 2° 22:00–00:00. Personas ≥1.
   - Plano: **landscape en desktop, portrait (rotado, ejes x/y intercambiados) en mobile**. Coordenadas en % (x 0–100, y 0–70 → alto = y/70). Estados por **borde+relleno+etiqueta, no solo color**: Disponible (borde sólido blanco), Tu elección (✓, relleno claro), Pendiente (borde punteado kraft + rayas), Reservada/Ocupada (gris, "OCUP."), Libre pero chica (capacidad < personas, no seleccionable). Solo se elige mesa `libre` y `cap ≥ personas`; las demás `cursor:not-allowed`, con `aria-label` ("Mesa 3, 4 personas, disponible").
   - Paso 3: nombre, teléfono, comentario (obligatorios nombre y teléfono). Estado "sin mesas" con sugerencia de otro turno/día.
   - Confirmación: mesa, nombre, fecha larga ("Lunes 26 de octubre"), turno, personas. La reserva queda **Pendiente** hasta que el local confirma por WhatsApp.
6. **Contacto/Nosotros**: dirección, horarios, WhatsApp, Instagram, mapa (placeholder).

## Panel de admin — pantallas
Login → shell con sidebar: Inicio, Reservas (badge = pendientes), Productos, Categorías, Eventos y promos, Plano del local, Datos del local. Hash por pantalla (`#reservas`, `#reservas-plano`, `#producto-editar`…).
- **Inicio**: reservas de hoy, contador de pendientes.
- **Reservas**: selector de día y turno; vista lista/plano. Fila: hora, nombre, personas, mesa, origen (`web|tel|wa`), nota, tag de estado (`pend` Pendiente borde punteado kraft; `conf` Confirmada relleno claro; `canc` Cancelada tachada al 55%; `occ` Ocupada sin reserva; `free` Libre). Acciones: **Confirmar** (abre `wa.me/549<tel>` con texto "¡Hola {nombre}! Te confirmamos la reserva en Sumeria para el {día} {n} a las {hora}, {p} personas, mesa {m}. Te esperamos en 25 de Mayo 181. Si no podés venir, avisanos por acá." y pasa a `conf`), Rechazar/Cancelar (mesa vuelve a libre), Restaurar (→ pend), Cambiar mesa (select; marca "(ocupada)"), Marcar llegada. "Nueva reserva" manual (teléfono/WhatsApp) y mesas "ocupadas sin reserva" (`walkins`). Toast de 2,6 s tras cada acción.
- **Plano de reservas**: mesas coloreadas por estado, clic abre detalle lateral.
- **Productos**: lista con búsqueda, filtro categoría y disponibilidad (toggle). **Editor**: campos (nombre, descripción, categoría, piezas, precio, sin TACC, disponible, foto) con **vista previa en vivo** de la tarjeta pública.
- **Categorías**: reordenar (define el orden de la carta).
- **Eventos y promos**: lista + formulario (tipo, título, descripción, publicación `pub`, vencimiento `exp`, foto). Se muestran en el sitio solo entre `pub` y `exp`.
- **Plano del local (editor)**: drag de mesas (límites 0–100 / 0–70, redondeo a entero), edición de número, capacidad y forma (`round|square|long`; tamaño automático con `sizeFor`), agregar/quitar, aviso de cambios sin guardar (`planDirty`). Los `FIXTURES` (cocina, barra, banquetas, baños, ventanal, entrada) son fijos.
- **Datos del local**: horarios, zonas de envío y precios, número de WhatsApp, dirección.

## State Management
**Sitio**: `screen`, `cart {id:{qty,note}}`, `generalNote`, `mode`, `name`, `address`, `zone`, `tried`, `activeCat`, `evFilter`, `resStep`, `resDate`, `resTurn`, `resPeople`, `resTable`, `resName/Phone/Comment`, `lastRes`. Persistir carrito en `localStorage`.
**Panel**: `products`, `cats`, `events`, `tables`, `res`, `walkins {"<date>-<turn>":[mesas]}`, filtros, `ed` (producto en edición), `evDraft`, `planDirty`, `toast`.
**Regla de disponibilidad (real)**: una mesa está `free` para (fecha, turno) si no tiene reserva `pend|conf` ni walk-in. En el prototipo `statusOf` usa datos simulados (`(n*37+date*11+turn*5)%9`) — **reemplazar por consulta al backend**. Reservas `pend` bloquean la mesa (se ven "pendiente").

## Backend a construir (no está en el prototipo)
Los dos sitios hoy no comparten datos. Modelo sugerido:
Tablas en Neon (Drizzle). Fotos: guardar `photo_public_id` (Cloudinary) en lugar de `photo_url`.
- `categories(id, name, order)` · `products(id, category_id, name, description, pieces, price, gluten_free, available, photo_public_id)`
- `delivery_zones(id, name, description, price)` · `settings(whatsapp, address, hours)`
- `events(id, type, title, description, cta, published_at, expires_at, photo_public_id)`
- `tables(n, capacity, shape, x, y, w, h)` · `fixtures(...)`
- `reservations(id, date, turn, time, name, phone, people, table_n, status, source, note, created_at)` — índice único parcial (date, turn, table_n) donde status ≠ `canc`.
- Auth de admin (ver Stack); el sitio público solo lee y crea reservas. Validar con zod en el servidor; la creación de reserva debe correr en transacción y devolver 409 si la mesa ya fue tomada (índice único).
- Endpoints: `GET /menu`, `GET /events`, `GET /availability?date&turn&people`, `POST /reservations`; admin CRUD sobre todo lo anterior. Los cambios del plano y de disponibilidad de productos deben verse en el sitio.

## Accesibilidad / responsive
Targets táctiles ≥44px, `aria-label` en mesas, estados no dependen solo del color, contraste de texto ≥4.5:1. Sitio fluido 360–1440px; plano portrait en mobile, landscape en desktop.

## Assets
`reference/assets/`: `sumeria-logo-blanco.png`, `sumeria-logo-original.png` (150px, **pendiente versión vectorial**), `favicon.svg`. Fotos: placeholders (pendiente fotografía real oscura, cálida, de producto).

## Files
- `reference/Sumeria Sitio.dc.html` — sitio público (datos + lógica al final)
- `reference/Sumeria Panel.dc.html` — panel de admin
- `reference/Sumeria Sistema.dc.html` — guía de sistema visual y estados
- `reference/support.js`, `reference/assets/` — requeridos para abrirlos
