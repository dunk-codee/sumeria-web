import type { NextRequest } from "next/server";
import { tableStatuses } from "@/lib/availability";
import { getSession } from "@/lib/auth";
import { getPlan } from "@/lib/data";
import { isISODate } from "@/lib/dates";

/**
 * GET /api/admin/availability?date=YYYY-MM-DD — mesas libres de un día, sin las reglas
 * del sitio (rango, bloqueos, corte de las 19:30). Lo usa el panel para cargar reservas.
 */
export async function GET(request: NextRequest) {
  if (!(await getSession())) return Response.json({ error: "No autorizado" }, { status: 401 });
  const date = request.nextUrl.searchParams.get("date");
  if (!date || !isISODate(date)) return Response.json({ error: "Fecha inválida" }, { status: 400 });
  const [plan, statuses] = await Promise.all([getPlan(), tableStatuses(date)]);
  const tables = plan.tables.map((t) => ({ n: t.n, capacity: t.capacity, status: statuses[t.n] ?? "free" }));
  return Response.json({ date, tables }, { headers: { "Cache-Control": "no-store" } });
}
