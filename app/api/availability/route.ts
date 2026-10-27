import type { NextRequest } from "next/server";
import { tableStatuses } from "@/lib/availability";
import { getPlan } from "@/lib/data";
import { dbConfigured } from "@/lib/db";
import { availabilityQuery } from "@/lib/validation";

/**
 * GET /api/availability?date=YYYY-MM-DD&turn=0|1&people=N
 * Devuelve el estado público de cada mesa (sin datos de clientes).
 */
export async function GET(request: NextRequest) {
  if (!dbConfigured()) return Response.json({ error: "Reservas online no disponibles" }, { status: 503 });
  const parsed = availabilityQuery.safeParse(Object.fromEntries(request.nextUrl.searchParams));
  if (!parsed.success) return Response.json({ error: "Parámetros inválidos" }, { status: 400 });
  const { date, turn, people } = parsed.data;

  const [plan, statuses] = await Promise.all([getPlan(), tableStatuses(date, turn)]);
  const tables = plan.tables.map((t) => {
    const status = statuses[t.n] ?? "free";
    return { n: t.n, capacity: t.capacity, status, selectable: status === "free" && t.capacity >= people };
  });
  return Response.json({ date, turn, people, tables }, { headers: { "Cache-Control": "no-store" } });
}
