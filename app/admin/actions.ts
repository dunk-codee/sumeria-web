"use server";

import { and, eq, gte, inArray, ne, notInArray, sql } from "drizzle-orm";
import { refresh, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { checkCredentials, endSession, requireAdmin, startSession } from "@/lib/auth";
import { TAGS } from "@/lib/data";
import { todayISO } from "@/lib/dates";
import { getDb, isUniqueViolation } from "@/lib/db";
import { sizeFor } from "@/lib/plan";
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
import { turnOf } from "@/lib/turns";
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

export async function setReservationStatus(id: number, status: "pend" | "conf" | "canc"): Promise<ActionResult> {
  await requireAdmin();
  const db = await getDb();
  try {
    await db.update(reservations).set({ status }).where(eq(reservations.id, id));
  } catch (e) {
    if (isUniqueViolation(e)) return fail("La mesa ya está tomada en ese turno. Cambiala antes de restaurar.");
    throw e;
  }
  done();
  return ok();
}

export async function markArrived(id: number): Promise<ActionResult> {
  await requireAdmin();
  const db = await getDb();
  await db.update(reservations).set({ arrivedAt: new Date(), status: "conf" }).where(eq(reservations.id, id));
  done();
  return ok();
}

export async function changeReservationTable(id: number, tableN: number): Promise<ActionResult> {
  await requireAdmin();
  const db = await getDb();
  try {
    await db.update(reservations).set({ tableN }).where(eq(reservations.id, id));
  } catch (e) {
    if (isUniqueViolation(e)) return fail(`La mesa ${tableN} ya está ocupada en ese turno.`);
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
  turn: z.number().int().min(0).max(1),
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
  try {
    const [row] = await db
      .insert(reservations)
      .values({ ...r, time: turnOf(r.turn).time, phone: r.phone || "—", status: "conf" })
      .returning({ id: reservations.id });
    done();
    return ok(row.id);
  } catch (e) {
    if (isUniqueViolation(e)) return fail(`La mesa ${r.tableN} ya está tomada en ese turno.`);
    throw e;
  }
}

/** Mesa ocupada por gente sin reserva (queda bloqueada en el sitio). */
export async function setWalkin(date: string, turn: number, tableN: number, on: boolean): Promise<ActionResult> {
  await requireAdmin();
  const db = await getDb();
  if (on) {
    try {
      await db.insert(reservations).values({
        date,
        turn,
        tableN,
        time: turnOf(turn).time,
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
    await db
      .delete(reservations)
      .where(and(eq(reservations.date, date), eq(reservations.turn, turn), eq(reservations.tableN, tableN), eq(reservations.status, "occ")));
  }
  done();
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
      shape: z.enum(TABLE_SHAPES),
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
        list.map((t) => {
          const s = sizeFor(t.capacity, t.shape);
          return {
            n: t.n,
            capacity: t.capacity,
            shape: t.shape,
            x: Math.max(0, Math.min(100 - s.w, Math.round(t.x))),
            y: Math.max(0, Math.min(70 - s.h, Math.round(t.y))),
            ...s,
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

