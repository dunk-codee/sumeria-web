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
import { getDb, isUniqueViolation } from "@/lib/db";
import { TABLE_BOX } from "@/lib/plan";
import {
  categories,
  deliveryZones,
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
      .values({ ...r, turn: TURN.id, time: TURN.time, phone: r.phone || "—", status: "conf" })
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
        time: TURN.time,
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

const bookingInput = z
  .object({
    from: isoDate.nullable(),
    to: isoDate.nullable(),
    blocked: z.array(isoDate).max(400),
  })
  .refine((b) => (b.from === null) === (b.to === null), { message: "Elegí el primer y el último día, o dejá los dos vacíos." })
  .refine((b) => !b.from || !b.to || b.to >= b.from, { message: "El último día tiene que ser igual o posterior al primero." })
  .refine((b) => !b.from || !b.to || b.to <= addDays(b.from, MAX_BOOKING_SPAN - 1), {
    message: `El rango puede abarcar hasta ${MAX_BOOKING_SPAN} días.`,
  });
export type BookingInput = z.input<typeof bookingInput>;

/** Define desde qué día hasta cuál se puede reservar desde el sitio y qué días quedan cerrados. */
export async function saveBooking(input: BookingInput): Promise<ActionResult> {
  await requireAdmin();
  const p = bookingInput.safeParse(input);
  if (!p.success) return fail(p.error.issues[0]?.message ?? "Revisá las fechas.");
  const { from, to } = p.data;
  const today = todayISO();
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
  description: z.string().trim().max(280),
  pieces: z.string().trim().max(30),
  price: z.number().int().min(0).max(10_000_000),
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
  if (id) {
    await db.update(products).set(values).where(eq(products.id, id));
  } else {
    const [{ max }] = await db
      .select({ max: sql<number>`coalesce(max(${products.position}), -1)::int` })
      .from(products)
      .where(eq(products.categoryId, data.categoryId));
    const [row] = await db.insert(products).values({ ...values, position: max + 1 }).returning({ id: products.id });
    savedId = row.id;
  }
  done(TAGS.menu);
  return ok(savedId);
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
    const name = patch.name.trim().slice(0, 40);
    if (!name) return fail("La categoría necesita un nombre.");
    set.name = name;
    // El slug sigue al nombre (es el ancla #cat-… de la carta) si no choca con otro.
    const slug = slugify(name);
    const [clash] = await db.select({ id: categories.id }).from(categories).where(and(eq(categories.slug, slug), ne(categories.id, id)));
    if (!clash) set.slug = slug;
  }
  if (patch.visible !== undefined) set.visible = patch.visible;
  if (patch.featured !== undefined) set.featured = patch.featured;
  await db.update(categories).set(set).where(eq(categories.id, id));
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
  done(TAGS.menu);
  return ok();
}

export async function deleteCategory(id: number): Promise<ActionResult> {
  await requireAdmin();
  const db = await getDb();
  const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(products).where(eq(products.categoryId, id));
  if (n > 0) return fail("Mové o eliminá sus productos antes de borrar la categoría.");
  await db.delete(categories).where(eq(categories.id, id));
  done(TAGS.menu);
  return ok();
}

/* ---------------- Eventos y promos ---------------- */

const eventInput = z
  .object({
    id: z.number().int().positive().optional(),
    type: z.enum(EVENT_TYPES),
    title: z.string().trim().min(1, "Poné un título").max(90),
    description: z.string().trim().max(400),
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
      // Se acepta por compatibilidad, pero siempre se guarda "square".
      shape: z.enum(TABLE_SHAPES).optional(),
      x: z.number().min(0).max(100),
      y: z.number().min(0).max(70),
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
        // Todas las mesas son cuadradas y del mismo tamaño (ver `TABLE_SIZE`).
        list.map((t) => ({
          n: t.n,
          capacity: t.capacity,
          shape: "square" as const,
          x: Math.max(0, Math.min(100 - TABLE_BOX.w, Math.round(t.x))),
          y: Math.max(0, Math.min(70 - TABLE_BOX.h, Math.round(t.y))),
          ...TABLE_BOX,
          location: t.location || "Salón",
        })),
      );
    }
  });
  done(TAGS.plan);
  return ok();
}

/* ---------------- Datos del local ---------------- */

const hhmm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Usá el formato HH:MM");
const settingsInput = z.object({
  address: z.string().trim().min(3).max(120),
  city: z.string().trim().min(2).max(120),
  whatsapp: z
    .string()
    .transform((v) => v.replace(/\D/g, ""))
    .refine((v) => v.length >= 10 && v.length <= 15, "El WhatsApp tiene que tener código de país y área (ej.: +54 9 3442 535419)."),
  instagram: z
    .string()
    .trim()
    .transform((v) => v.replace(/^@/, ""))
    .refine((v) => /^[A-Za-z0-9._]{1,30}$/.test(v), "Usuario de Instagram inválido"),
  hours: z.array(z.object({ key: z.enum(["salon", "pedidos", "reservas"]), label: z.string().max(60), from: hhmm, to: hhmm })),
  zones: z.array(
    z.object({
      name: z.string().trim().min(1, "Cada zona necesita un nombre").max(60),
      description: z.string().trim().max(120),
      price: z.number().int().min(0).max(1_000_000),
    }),
  ),
});
export type SettingsInput = z.input<typeof settingsInput>;

export async function saveSettings(input: SettingsInput): Promise<ActionResult> {
  await requireAdmin();
  const p = settingsInput.safeParse(input);
  if (!p.success) return fail(p.error.issues[0]?.message ?? "Revisá los datos.");
  const { zones, ...s } = p.data;
  const db = await getDb();
  await db.transaction(async (tx) => {
    await tx.insert(settings).values({ id: 1, ...s }).onConflictDoUpdate({ target: settings.id, set: s });
    await tx.delete(deliveryZones);
    if (zones.length) await tx.insert(deliveryZones).values(zones.map((z, i) => ({ ...z, position: i })));
  });
  done(TAGS.settings);
  return ok();
}

