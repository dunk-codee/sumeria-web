import { count, max } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { dbConfigured, getDb } from "@/lib/db";
import { reservations } from "@/lib/schema";

/**
 * GET /api/admin/reservations-stamp — "huella" liviana de las reservas (última y cantidad). El panel la consulta cada
 * pocos segundos y, si cambió, se refresca solo (ver `LiveReservations`). Solo con sesión.
 */
export async function GET() {
  if (!(await getSession())) return Response.json({ error: "No autorizado" }, { status: 401 });
  if (!dbConfigured()) return Response.json({ error: "Sin base de datos" }, { status: 503 });
  const db = await getDb();
  const [row] = await db.select({ latest: max(reservations.id), total: count() }).from(reservations);
  return Response.json({ latest: row?.latest ?? 0, total: row?.total ?? 0 }, { headers: { "Cache-Control": "no-store" } });
}
