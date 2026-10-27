import { and, eq, inArray, ne } from "drizzle-orm";
import { seatingOptions, type ComboTable, type SeatingOption, type SeatingTier } from "./combos";
import { getDb, type DB } from "./db";
import { reservations, type ResStatus } from "./schema";

/** Estado público de una mesa: libre, pendiente de confirmar u ocupada/reservada. */
export type PublicTableStatus = "free" | "pend" | "res";

/** Lo mínimo de la base que necesitan estas consultas (sirve la conexión y una transacción). */
type Executor = Pick<DB, "select">;

/**
 * Regla real de disponibilidad: hay un único turno por día, así que una mesa está libre
 * para una fecha si no tiene reserva `pend`/`conf` ni está ocupada sin reserva (`occ`).
 * No se filtra por `turn`: así también cuentan las reservas viejas del segundo turno.
 */
export async function tableStatuses(date: string): Promise<Record<number, PublicTableStatus>> {
  const db = await getDb();
  const rows = await db
    .select({ tableN: reservations.tableN, status: reservations.status })
    .from(reservations)
    .where(and(eq(reservations.date, date), ne(reservations.status, "canc")));
  const out: Record<number, PublicTableStatus> = {};
  for (const r of rows) out[r.tableN] = toPublic(r.status);
  return out;
}

/** De las mesas pedidas, las que ya tienen una reserva activa ese día (en cualquier turno). */
export async function takenTables(db: Executor, date: string, tableNs: number[]): Promise<number[]> {
  if (!tableNs.length) return [];
  const rows = await db
    .select({ tableN: reservations.tableN })
    .from(reservations)
    .where(and(eq(reservations.date, date), inArray(reservations.tableN, tableNs), ne(reservations.status, "canc")));
  return rows.map((r) => r.tableN);
}

export type TableAvailability = { n: number; capacity: number; status: PublicTableStatus };

/** Mesas con su estado y opciones de lugar para el grupo (sin datos de clientes). Ver `lib/combos.ts`. */
export function buildAvailability(
  planTables: ComboTable[],
  statuses: Record<number, PublicTableStatus>,
  people: number,
): { tables: TableAvailability[]; tier: SeatingTier; options: SeatingOption[] } {
  const tables = planTables.map((t) => ({ n: t.n, capacity: t.capacity, status: statuses[t.n] ?? "free" }));
  const free = planTables.filter((t) => (statuses[t.n] ?? "free") === "free");
  return { tables, ...seatingOptions(free, people) };
}

function toPublic(s: ResStatus): PublicTableStatus {
  return s === "pend" ? "pend" : "res";
}
