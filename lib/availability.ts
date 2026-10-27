import { and, eq, ne } from "drizzle-orm";
import { getDb } from "./db";
import { reservations, type ResStatus } from "./schema";

/** Estado público de una mesa: libre, pendiente de confirmar u ocupada/reservada. */
export type PublicTableStatus = "free" | "pend" | "res";

/**
 * Regla real de disponibilidad: una mesa está libre para (fecha, turno) si no
 * tiene reserva `pend`/`conf` ni está ocupada sin reserva (`occ`).
 */
export async function tableStatuses(date: string, turn: number): Promise<Record<number, PublicTableStatus>> {
  const db = await getDb();
  const rows = await db
    .select({ tableN: reservations.tableN, status: reservations.status })
    .from(reservations)
    .where(and(eq(reservations.date, date), eq(reservations.turn, turn), ne(reservations.status, "canc")));
  const out: Record<number, PublicTableStatus> = {};
  for (const r of rows) out[r.tableN] = toPublic(r.status);
  return out;
}

function toPublic(s: ResStatus): PublicTableStatus {
  return s === "pend" ? "pend" : "res";
}
