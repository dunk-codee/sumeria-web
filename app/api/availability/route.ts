import type { NextRequest } from "next/server";
import { buildAvailability, tableStatuses } from "@/lib/availability";
import { bookingStatus, BOOKING_ERRORS } from "@/lib/booking";
import { getPlan, getSettings } from "@/lib/data";
import { dbConfigured } from "@/lib/db";
import { availabilityQuery } from "@/lib/validation";

/**
 * GET /api/availability?date=YYYY-MM-DD&people=N
 * Devuelve el estado público de cada mesa y las combinaciones posibles (sin datos de clientes).
 * Respeta el rango de días reservables; para hoy después de las 19:30 devuelve `cutoff: true`
 * con ninguna mesa seleccionable. Siempre fresca.
 */
export async function GET(request: NextRequest) {
  if (!dbConfigured()) return Response.json({ error: "Reservas online no disponibles" }, { status: 503 });
  const parsed = availabilityQuery.safeParse(Object.fromEntries(request.nextUrl.searchParams));
  if (!parsed.success) return Response.json({ error: "Parámetros inválidos" }, { status: 400 });
  const { date, people } = parsed.data;

  const settings = await getSettings();
  const status = bookingStatus(date, settings.booking);
  if (status === "out_of_range" || status === "blocked") {
    return Response.json({ error: BOOKING_ERRORS[status], code: status }, { status: 400, headers: { "Cache-Control": "no-store" } });
  }

  const [plan, statuses] = await Promise.all([getPlan(), tableStatuses(date)]);
  const { tables, combos } = buildAvailability(plan.tables, statuses, people);
  const cutoff = status === "cutoff";
  return Response.json(
    {
      date,
      people,
      cutoff,
      tables: cutoff ? tables.map((t) => ({ ...t, selectable: false })) : tables,
      combos: cutoff ? [] : combos,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
