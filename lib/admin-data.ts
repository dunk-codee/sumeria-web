import { and, asc, eq, gte, inArray, lte, ne, sql } from "drizzle-orm";
import { addDays, todayISO } from "./dates";
import { getDb } from "./db";
import { DEFAULT_SETTINGS } from "./defaults";
import { categories, deliveryZones, events, fixtures, products, reservations, settings, tables } from "./schema";

/** Lecturas del panel: siempre frescas (sin caché). */

export type AdminReservation = {
  id: number;
  date: string;
  time: string;
  name: string;
  phone: string;
  people: number;
  /** Mesa principal (la menor). En reservas combinadas, ver `tables`. */
  tableN: number;
  /** Todas las mesas de la reserva (más de una si se combinaron). */
  tables: number[];
  status: "pend" | "conf" | "canc" | "occ";
  source: "web" | "tel" | "wa" | "walkin";
  note: string;
  arrived: boolean;
};

const resCols = {
  id: reservations.id,
  date: reservations.date,
  time: reservations.time,
  name: reservations.name,
  phone: reservations.phone,
  people: reservations.people,
  tableN: reservations.tableN,
  groupId: reservations.groupId,
  status: reservations.status,
  source: reservations.source,
  note: reservations.note,
  arrivedAt: reservations.arrivedAt,
};

type ResRow = { arrivedAt: Date | null; groupId: string | null } & Omit<AdminReservation, "arrived" | "tables">;

/** Une las filas de una reserva combinada (una por mesa) en una sola reserva. */
function collapse(rows: ResRow[]): AdminReservation[] {
  const groups = new Map<string, AdminReservation>();
  const out: AdminReservation[] = [];
  for (const { arrivedAt, groupId, ...rest } of rows) {
    const base: AdminReservation = { ...rest, tables: [rest.tableN], arrived: !!arrivedAt };
    const g = groupId ? groups.get(groupId) : undefined;
    if (g) {
      g.tables = [...g.tables, rest.tableN].sort((a, b) => a - b);
      g.tableN = g.tables[0];
      continue;
    }
    if (groupId) groups.set(groupId, base);
    out.push(base);
  }
  return out;
}

export async function pendingCount(): Promise<number> {
  const db = await getDb();
  const [{ n }] = await db
    .select({ n: sql<number>`count(distinct coalesce(${reservations.groupId}, ${reservations.id}::text))::int` })
    .from(reservations)
    .where(and(eq(reservations.status, "pend"), gte(reservations.date, todayISO())));
  return n;
}

/** Reservas (incluye ocupadas sin reserva) entre dos fechas. */
export async function reservationsBetween(from: string, to: string): Promise<AdminReservation[]> {
  const db = await getDb();
  const rows = await db
    .select(resCols)
    .from(reservations)
    .where(and(gte(reservations.date, from), lte(reservations.date, to)))
    .orderBy(asc(reservations.date), asc(reservations.time), asc(reservations.id));
  return collapse(rows);
}

export async function pendingFrom(from: string): Promise<AdminReservation[]> {
  const db = await getDb();
  const rows = await db
    .select(resCols)
    .from(reservations)
    .where(and(eq(reservations.status, "pend"), gte(reservations.date, from)))
    .orderBy(asc(reservations.date), asc(reservations.time), asc(reservations.id));
  return collapse(rows);
}

export async function planTables() {
  const db = await getDb();
  const t = await db.select().from(tables).orderBy(asc(tables.n));
  const f = await db.select().from(fixtures).orderBy(asc(fixtures.id));
  return { tables: t, fixtures: f };
}

export async function adminProducts() {
  const db = await getDb();
  const cats = await db.select().from(categories).orderBy(asc(categories.position), asc(categories.id));
  const order = new Map(cats.map((c, i) => [c.id, i]));
  const prods = (await db.select().from(products).orderBy(asc(products.position), asc(products.id))).sort(
    (a, b) => (order.get(a.categoryId) ?? 0) - (order.get(b.categoryId) ?? 0),
  );
  return { cats, prods };
}

export async function adminProduct(id: number) {
  const db = await getDb();
  const [p] = await db.select().from(products).where(eq(products.id, id));
  return p ?? null;
}

export async function adminEvents() {
  const db = await getDb();
  return db.select().from(events).orderBy(sql`${events.publishedAt} desc`, asc(events.id));
}

export async function adminSettings() {
  const db = await getDb();
  const [row] = await db.select().from(settings).where(eq(settings.id, 1));
  const zones = await db.select().from(deliveryZones).orderBy(asc(deliveryZones.position), asc(deliveryZones.id));
  const { zones: _z, ...defaults } = DEFAULT_SETTINGS;
  void _z;
  return { ...(row ?? { id: 1, ...defaults, bookingFrom: null, bookingTo: null, blockedDates: [] as string[] }), zones };
}

/** Mesas con reservas activas a futuro (para avisar antes de quitarlas del plano). */
export async function tablesWithUpcoming(): Promise<number[]> {
  const db = await getDb();
  const rows = await db
    .selectDistinct({ n: reservations.tableN })
    .from(reservations)
    .where(and(gte(reservations.date, todayISO()), inArray(reservations.status, ["pend", "conf"]), ne(reservations.source, "walkin")));
  return rows.map((r) => r.n);
}

export function weekFrom(today: string, days = 7) {
  return { from: today, to: addDays(today, days - 1) };
}
