"use server";

import { and, eq, gte, inArray, ne, notInArray, sql } from "drizzle-orm";
import { refresh, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { checkCredentials, endSession, requireAdmin, startSession } from "@/lib/auth";
import { takenTables } from "@/lib/availability";
import { MAX_BOOKING_SPAN } from "@/lib/booking";
import { TAGS } from "@/lib/data";
import { DEFAULT_SETTINGS } from "@/lib/defaults";
import { addDays, todayISO } from "@/lib/dates";
import { CATEGORY_NAME_MAX, FEATURED_MAX } from "@/lib/categories";
import { arPhoneDigits, instagramHandle, isArPhone, isInstagramHandle } from "@/lib/contact";
import { reservationTime, weekOf } from "@/lib/hours";
import { getDb, isUniqueViolation } from "@/lib/db";
import { TABLE_BOX, TABLE_MAX, TABLE_MIN } from "@/lib/plan";
import {
  categories,
  EVENT_TYPES,
  events,
  PLACEHOLDERS,
  products,
  reservations,
  settings,
  TABLE_SHAPES,
  tables,
} from "@/lib/schema";
import { TURN } from "@/lib/turns";
import { isoDate } from "@/lib/validation";

export type ActionResult = { ok: true; id?: number } | { ok: false; error: string };

const ok = (id?: number): ActionResult => ({ ok: true, id });
const fail = (error: string): ActionResult => ({ ok: false, error });

function done(...tags: string[]) {
  for (const t of tags) updateTag(t);
  refresh();
}

/* ---------------- Sesión ---------------- */

export async function login(_prev: { error?: string } | undefined, form: FormData): Promise<{ error?: string }> {
  const email = String(form.get("email") ?? "");
  const password = String(form.get("password") ?? "");
  if (!checkCredentials(email, password)) {
    await new Promise((r) => setTimeout(r, 400));
    return { error: "Email o contraseña incorrectos." };
  }
  await startSession(email.trim().toLowerCase());
  redirect("/admin");
}

export async function logout() {
  await endSession();
  redirect("/admin/login");
}

/* ---------------- Reservas ---------------- */

/** Condición que alcanza a todas las filas de una reserva (una por mesa si es combinada). */
async function sameReservation(db: Awaited<ReturnType<typeof getDb>>, id: number) {
  const [row] = await db.select({ groupId: reservations.groupId }).from(reservations).where(eq(reservations.id, id));
  return row?.groupId ? eq(reservations.groupId, row.groupId) : eq(reservations.id, id);
}

export async function setReservationStatus(id: number, status: "pend" | "conf" | "canc"): Promise<ActionResult> {
  await requireAdmin();
  const db = await getDb();
  const where = await sameReservation(db, id);
  try {
    await db.transaction(async (tx) => {
      const rows = await tx.select().from(reservations).where(where);
      if (!rows.length) return;
      // Restaurar: las mesas no pueden haber sido tomadas (también por reservas viejas de otro turno).
      if (rows[0].status === "canc" && status !== "canc") {
        const taken = await takenTables(tx, rows[0].date, rows.map((r) => r.tableN));
        if (taken.length) throw new Taken(taken);
      }
      await tx.update(reservations).set({ status }).where(where);
    });
  } catch (e) {
    if (e instanceof Taken) return fail(`La mesa ${e.tables.join(", ")} ya está tomada ese día. Cambiala antes de restaurar.`);
    if (isUniqueViolation(e)) return fail("La mesa ya está tomada ese día. Cambiala antes de restaurar.");
    throw e;
  }
  done();
  return ok();
}

class Taken extends Error {
  constructor(public tables: number[]) {
    super("Mesa tomada");
  }
}

export async function markArrived(id: number): Promise<ActionResult> {
  await requireAdmin();
  const db = await getDb();
  await db.update(reservations).set({ arrivedAt: new Date(), status: "conf" }).where(await sameReservation(db, id));
  done();
  return ok();
}

export async function changeReservationTable(id: number, tableN: number): Promise<ActionResult> {
  await requireAdmin();
  const db = await getDb();
  const [row] = await db.select().from(reservations).where(eq(reservations.id, id));
  if (!row) return fail("No encontramos la reserva.");
  if (row.groupId) return fail("Es una reserva de mesas combinadas: cancelala y cargá una nueva para cambiar las mesas.");
  if ((await takenTables(db, row.date, [tableN])).length) return fail(`La mesa ${tableN} ya está ocupada ese día.`);
  try {
    await db.update(reservations).set({ tableN }).where(eq(reservations.id, id));
  } catch (e) {
    if (isUniqueViolation(e)) return fail(`La mesa ${tableN} ya está ocupada ese día.`);
    throw e;
  }
  done();
  return ok();
}

/** Hora de reserva de un día (la de apertura de ese día de la semana). */
async function timeFor(db: Awaited<ReturnType<typeof getDb>>, date: string) {
  const [row] = await db.select({ hours: settings.hours }).from(settings).where(eq(settings.id, 1));
  return reservationTime(weekOf(row?.hours), date);
}

const manualRes = z.object({
  source: z.enum(["tel", "wa"]),
  name: z.string().trim().min(1).max(80),
  phone: z.string().trim().max(30).default(""),
  date: isoDate,
  people: z.number().int().min(1).max(40),
  tableN: z.number().int().positive(),
  note: z.string().trim().max(300).default(""),
});

export async function createManualReservation(input: z.input<typeof manualRes>): Promise<ActionResult> {
  await requireAdmin();
  const p = manualRes.safeParse(input);
  if (!p.success) return fail("Completá nombre y elegí una mesa libre.");
  const r = p.data;
  const db = await getDb();
  if ((await takenTables(db, r.date, [r.tableN])).length) return fail(`La mesa ${r.tableN} ya está tomada ese día.`);
  try {
    const [row] = await db
      .insert(reservations)
      .values({ ...r, turn: TURN.id, time: await timeFor(db, r.date), phone: r.phone || "—", status: "conf" })
      .returning({ id: reservations.id });
    done();
    return ok(row.id);
  } catch (e) {
    if (isUniqueViolation(e)) return fail(`La mesa ${r.tableN} ya está tomada ese día.`);
    throw e;
  }
}

/** Mesa ocupada por gente sin reserva (queda bloqueada en el sitio). */
export async function setWalkin(date: string, tableN: number, on: boolean): Promise<ActionResult> {
  await requireAdmin();
  if (!isoDate.safeParse(date).success) return fail("Fecha inválida.");
  const db = await getDb();
  if (on) {
    if ((await takenTables(db, date, [tableN])).length) return fail(`La mesa ${tableN} ya está tomada.`);
    try {
      await db.insert(reservations).values({
        date,
        turn: TURN.id,
        tableN,
        time: await timeFor(db, date),
        name: "Sin reserva",
        people: 0,
        status: "occ",
        source: "walkin",
      });
    } catch (e) {
      if (isUniqueViolation(e)) return fail(`La mesa ${tableN} ya está tomada.`);
      throw e;
    }
  } else {
    await db.delete(reservations).where(and(eq(reservations.date, date), eq(reservations.tableN, tableN), eq(reservations.status, "occ")));
  }
  done();
  return ok();
}

/* ---------------- Calendario de reservas ---------------- */

const bookingInput = z.object({
  /** Días hacia adelante que se puede reservar (rango móvil que se renueva cada día). Null: valor por defecto. */
  ahead: z.number().int().min(0).max(MAX_BOOKING_SPAN - 1).nullable(),
  blocked: z.array(isoDate).max(400),
});
export type BookingInput = z.input<typeof bookingInput>;

/** Define cuántos días hacia adelante se reserva desde el sitio (se renueva solo) y qué días quedan cerrados. */
export async function saveBooking(input: BookingInput): Promise<ActionResult> {
  await requireAdmin();
  const p = bookingInput.safeParse(input);
  if (!p.success) return fail(p.error.issues[0]?.message ?? "Revisá los datos.");
  const today = todayISO();
  // Se guarda el día de hoy y hoy + anticipación: la diferencia es lo único que se usa (ver `bookingAhead`).
  const from = p.data.ahead === null ? null : today;
  const to = p.data.ahead === null ? null : addDays(today, p.data.ahead);
  const blocked = [...new Set(p.data.blocked)].filter((d) => d >= today).sort();
  const { zones: _z, ...defaults } = DEFAULT_SETTINGS;
  void _z;
  const db = await getDb();
  await db
    .insert(settings)
    .values({ id: 1, ...defaults, bookingFrom: from, bookingTo: to, blockedDates: blocked })
    .onConflictDoUpdate({ target: settings.id, set: { bookingFrom: from, bookingTo: to, blockedDates: blocked } });
  done(TAGS.settings);
  return ok();
}

/* ---------------- Productos ---------------- */

const productInput = z.object({
  id: z.number().int().positive().optional(),
  categoryId: z.number().int().positive(),
  name: z.string().trim().min(1, "Poné un nombre").max(80),
  description: z.string().trim().min(1, "Escribí una descripción corta").max(280),
  pieces: z.string().trim().max(30),
  price: z.number().int().min(1, "Poné un precio mayor a 0").max(10_000_000),
  glutenFree: z.boolean(),
  available: z.boolean(),
  placeholder: z.enum(PLACEHOLDERS),
  photoPublicId: z.string().max(300).nullable(),
  photoUrl: z.string().max(600).nullable(),
  photoCutout: z.boolean(),
});
export type ProductInput = z.input<typeof productInput>;

export async function saveProduct(input: ProductInput): Promise<ActionResult> {
  await requireAdmin();
  const p = productInput.safeParse(input);
  if (!p.success) return fail(p.error.issues[0]?.message ?? "Revisá los datos del producto.");
  const { id, ...data } = p.data;
  const values = { ...data, pieces: data.pieces || null };
  const db = await getDb();
  let savedId = id;
  const nextPosition = async () => {
    const [{ max }] = await db
      .select({ max: sql<number>`coalesce(max(${products.position}), -1)::int` })
      .from(products)
      .where(eq(products.categoryId, data.categoryId));
    return max + 1;
  };
  if (id) {
    const [prev] = await db.select({ categoryId: products.categoryId }).from(products).where(eq(products.id, id));
    // Si cambia de categoría, va al final de la nueva (no se queda en el medio con el orden de la anterior).
    await db.update(products).set(prev && prev.categoryId !== data.categoryId ? { ...values, position: await nextPosition() } : values).where(eq(products.id, id));
  } else {
    const [row] = await db.insert(products).values({ ...values, position: await nextPosition() }).returning({ id: products.id });
    savedId = row.id;
  }
  done(TAGS.menu);
  return ok(savedId);
}

/** Guarda el orden de los productos de una categoría (el de la carta). */
export async function reorderProducts(categoryId: number, ids: number[]): Promise<ActionResult> {
  await requireAdmin();
  const p = z.object({ categoryId: z.number().int().positive(), ids: z.array(z.number().int().positive()).min(1).max(500) }).safeParse({ categoryId, ids });
  if (!p.success) return fail("No pudimos guardar el orden.");
  const db = await getDb();
  await db.transaction(async (tx) => {
    const own = await tx.select({ id: products.id }).from(products).where(and(eq(products.categoryId, p.data.categoryId), inArray(products.id, p.data.ids)));
    const valid = new Set(own.map((r) => r.id));
    let i = 0;
    for (const id of p.data.ids) if (valid.has(id)) await tx.update(products).set({ position: i++ }).where(eq(products.id, id));
  });
  // Solo se expira la carta: la pantalla ya tiene el orden nuevo, así que no hace falta volver a pedir la página (se sentía trabado).
  updateTag(TAGS.menu);
  return ok();
}

export async function toggleProductAvailable(id: number, available: boolean): Promise<ActionResult> {
  await requireAdmin();
  const db = await getDb();
  await db.update(products).set({ available }).where(eq(products.id, id));
  done(TAGS.menu);
  return ok();
}

export async function deleteProduct(id: number): Promise<ActionResult> {
  await requireAdmin();
  const db = await getDb();
  await db.delete(products).where(eq(products.id, id));
  done(TAGS.menu);
  return ok();
}

/* ---------------- Categorías ---------------- */

const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "categoria";

export async function addCategory(): Promise<ActionResult> {
  await requireAdmin();
  const db = await getDb();
  const [{ max }] = await db.select({ max: sql<number>`coalesce(max(${categories.position}), -1)::int` }).from(categories);
  const [row] = await db
    .insert(categories)
    .values({ name: "Nueva categoría", slug: `nueva-${Date.now().toString(36)}`, position: max + 1, visible: false })
    .returning({ id: categories.id });
  done(TAGS.menu);
  return ok(row.id);
}

export async function updateCategory(id: number, patch: { name?: string; visible?: boolean; featured?: boolean }): Promise<ActionResult> {
  await requireAdmin();
  const db = await getDb();
  const set: Partial<typeof categories.$inferInsert> = {};
  if (patch.name !== undefined) {
    const name = patch.name.trim();
    if (!name) return fail("La categoría necesita un nombre.");
    if (name.length > CATEGORY_NAME_MAX) return fail(`El nombre puede tener hasta ${CATEGORY_NAME_MAX} letras.`);
    const others = await db.select({ name: categories.name }).from(categories).where(ne(categories.id, id));
    if (others.some((o) => o.name.trim().toLowerCase() === name.toLowerCase())) return fail("Ya hay una categoría con ese nombre.");
    set.name = name;
    // El slug sigue al nombre (es el ancla #cat-… de la carta) si no choca con otro.
    const slug = slugify(name);
    const [clash] = await db.select({ id: categories.id }).from(categories).where(and(eq(categories.slug, slug), ne(categories.id, id)));
    if (!clash) set.slug = slug;
  }
  const [prev] = patch.name !== undefined ? await db.select({ slug: categories.slug }).from(categories).where(eq(categories.id, id)) : [];
  if (patch.visible !== undefined) set.visible = patch.visible;
  if (patch.featured !== undefined) {
    if (patch.featured) {
      const [{ n }] = await db
        .select({ n: sql<number>`count(*)::int` })
        .from(categories)
        .where(and(eq(categories.featured, true), ne(categories.id, id)));
      if (n >= FEATURED_MAX) return fail(`En el inicio caben ${FEATURED_MAX} categorías. Sacá una para agregar otra.`);
    }
    set.featured = patch.featured;
  }
  await db.update(categories).set(set).where(eq(categories.id, id));
  // Si cambió el slug, las publicaciones cuyo botón llevaba a esta categoría pasan a apuntar al slug nuevo.
  if (prev && set.slug && set.slug !== prev.slug) {
    await db.update(events).set({ ctaTarget: `cat:${set.slug}` }).where(eq(events.ctaTarget, `cat:${prev.slug}`));
    done(TAGS.menu, TAGS.events);
    return ok();
  }
  done(TAGS.menu);
  return ok();
}

/** Guarda el nuevo orden (define el orden de la carta). */
export async function reorderCategories(ids: number[]): Promise<ActionResult> {
  await requireAdmin();
  const db = await getDb();
  await db.transaction(async (tx) => {
    for (const [i, id] of ids.entries()) await tx.update(categories).set({ position: i }).where(eq(categories.id, id));
  });
  // Solo se expira la carta: la pantalla ya tiene el orden nuevo y no hace falta volver a pedir la página.
  updateTag(TAGS.menu);
  return ok();
}

export async function deleteCategory(id: number): Promise<ActionResult> {
  await requireAdmin();
  const db = await getDb();
  const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(products).where(eq(products.categoryId, id));
  if (n > 0) return fail("Mové o eliminá sus productos antes de borrar la categoría.");
  const [cat] = await db.select({ slug: categories.slug }).from(categories).where(eq(categories.id, id));
  await db.delete(categories).where(eq(categories.id, id));
  // Las publicaciones que llevaban a esta categoría pasan a llevar a la carta completa.
  if (cat) await db.update(events).set({ ctaTarget: "carta" }).where(eq(events.ctaTarget, `cat:${cat.slug}`));
  done(TAGS.menu, TAGS.events);
  return ok();
}

/* ---------------- Eventos y promos ---------------- */

const eventInput = z
  .object({
    id: z.number().int().positive().optional(),
    type: z.enum(EVENT_TYPES),
    title: z.string().trim().min(1, "Poné un título").max(90),
    description: z.string().trim().min(1, "Escribí una descripción").max(400),
    ctaLabel: z.string().trim().max(40),
    ctaTarget: z.string().regex(/^(ig|carta|reserva|cat:[a-z0-9-]+)$/),
    eventDate: isoDate.nullable(),
    whenLabel: z.string().trim().max(60).nullable(),
    publishedAt: isoDate,
    expiresAt: isoDate,
    placeholder: z.enum(PLACEHOLDERS),
    photoPublicId: z.string().max(300).nullable(),
    photoUrl: z.string().max(600).nullable(),
  })
  .refine((e) => e.expiresAt >= e.publishedAt, { message: "El vencimiento tiene que ser después de la publicación." });
export type EventInput = z.input<typeof eventInput>;

export async function saveEvent(input: EventInput): Promise<ActionResult> {
  await requireAdmin();
  const p = eventInput.safeParse(input);
  if (!p.success) return fail(p.error.issues[0]?.message ?? "Revisá los datos de la publicación.");
  const { id, ...data } = p.data;
  const values = { ...data, whenLabel: data.whenLabel || null };
  const db = await getDb();
  let savedId = id;
  if (id) await db.update(events).set(values).where(eq(events.id, id));
  else savedId = (await db.insert(events).values(values).returning({ id: events.id }))[0].id;
  done(TAGS.events);
  return ok(savedId);
}

export async function deleteEvent(id: number): Promise<ActionResult> {
  await requireAdmin();
  const db = await getDb();
  await db.delete(events).where(eq(events.id, id));
  done(TAGS.events);
  return ok();
}

/* ---------------- Plano ---------------- */

const planInput = z
  .array(
    z.object({
      n: z.number().int().min(1).max(999),
      capacity: z.number().int().min(1).max(20),
      shape: z.enum(TABLE_SHAPES).optional(),
      x: z.number().min(0).max(100),
      y: z.number().min(0).max(70),
      w: z.number().min(TABLE_MIN).max(TABLE_MAX).optional(),
      h: z.number().min(TABLE_MIN).max(TABLE_MAX).optional(),
      location: z.string().trim().max(60),
    }),
  )
  .max(80);

export async function savePlan(input: z.input<typeof planInput>): Promise<ActionResult> {
  await requireAdmin();
  const p = planInput.safeParse(input);
  if (!p.success) return fail("El plano tiene datos inválidos.");
  const list = p.data;
  if (new Set(list.map((t) => t.n)).size !== list.length) return fail("Hay dos mesas con el mismo número.");
  const db = await getDb();

  // No se puede quitar una mesa con reservas activas a futuro.
  const keep = list.map((t) => t.n);
  const blocked = await db
    .select({ tableN: reservations.tableN })
    .from(reservations)
    .where(
      and(
        gte(reservations.date, todayISO()),
        inArray(reservations.status, ["pend", "conf"]),
        keep.length ? notInArray(reservations.tableN, keep) : sql`true`,
      ),
    );
  if (blocked.length) {
    const ns = [...new Set(blocked.map((b) => b.tableN))].sort((a, b) => a - b).join(", ");
    return fail(`La mesa ${ns} tiene reservas próximas. Cambiá esas reservas de mesa antes de quitarla.`);
  }

  await db.transaction(async (tx) => {
    await tx.delete(tables);
    if (list.length) {
      await tx.insert(tables).values(
        list.map((t) => {
          const w = Math.round(t.w ?? TABLE_BOX.w);
          const h = Math.round(t.h ?? TABLE_BOX.h);
          return {
            n: t.n,
            capacity: t.capacity,
            shape: t.shape === "round" ? ("round" as const) : ("square" as const),
            x: Math.max(0, Math.min(100 - w, Math.round(t.x))),
            y: Math.max(0, Math.min(70 - h, Math.round(t.y))),
            w,
            h,
            location: t.location || "Salón",
          };
        }),
      );
    }
  });
  done(TAGS.plan);
  return ok();
}

/* ---------------- Datos del local ---------------- */

const hhmm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Usá el formato HH:MM");
const settingsInput = z.object({
  address: z.string().trim().min(3, "Escribí la dirección.").max(120, "La dirección es muy larga."),
  city: z.string().trim().min(2, "Escribí la ciudad.").max(120, "La ciudad es muy larga."),
  whatsapp: z
    .string()
    .transform(arPhoneDigits)
    .refine(isArPhone, "Ingresá el celular completo: código de área y número (ej.: 3442 53-5419)."),
  instagram: z
    .string()
    .transform(instagramHandle)
    .refine(isInstagramHandle, "Usuario de Instagram inválido: solo letras, números, puntos y guiones bajos."),
  hours: z
    .array(z.object({ day: z.number().int().min(0).max(6), closed: z.boolean(), from: hhmm, to: hhmm, ordersFrom: hhmm }))
    .length(7, "Falta algún día de la semana.")
    .refine((h) => new Set(h.map((d) => d.day)).size === 7, "Hay un día repetido en los horarios."),
});
export type SettingsInput = z.input<typeof settingsInput>;

export async function saveSettings(input: SettingsInput): Promise<ActionResult> {
  await requireAdmin();
  const p = settingsInput.safeParse(input);
  if (!p.success) return fail(p.error.issues[0]?.message ?? "Revisá los datos.");
  const s = p.data;
  const db = await getDb();
  await db.insert(settings).values({ id: 1, ...s }).onConflictDoUpdate({ target: settings.id, set: s });
  done(TAGS.settings);
  return ok();
}

