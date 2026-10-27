import { takenTables } from "@/lib/availability";
import { bookingStatus, BOOKING_ERRORS } from "@/lib/booking";
import { isOffered, seatingOptions } from "@/lib/combos";
import { getSettings } from "@/lib/data";
import { dbConfigured, getDb, isUniqueViolation } from "@/lib/db";
import { reservations, tables } from "@/lib/schema";
import { TURN } from "@/lib/turns";
import { reservationInput } from "@/lib/validation";

class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string,
  ) {
    super(message);
  }
}

const TAKEN = "Alguien acaba de pedir esa mesa. Elegí otra.";

/**
 * POST /api/reservations — crea una reserva web en estado Pendiente.
 * Una mesa, o dos juntas (una fila por mesa con el mismo `group_id`). Solo acepta una de las opciones que
 * ofrece `seatingOptions` con las mesas libres de ese día (400 si no).
 * Rechaza fechas fuera del rango reservable (400) y, para hoy desde las 19:30, con 422 `cutoff`.
 * Corre en transacción; si alguna mesa ya fue tomada (índice único) responde 409.
 */
export async function POST(request: Request) {
  if (!dbConfigured()) {
    return Response.json({ error: "Las reservas online no están disponibles. Escribinos por WhatsApp." }, { status: 503 });
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Cuerpo inválido" }, { status: 400 });
  }
  const parsed = reservationInput.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0]?.message ?? "Datos inválidos" }, { status: 400 });
  }
  const r = parsed.data;

  const settings = await getSettings();
  const status = bookingStatus(r.date, settings.booking);
  if (status !== "ok") {
    return Response.json({ error: BOOKING_ERRORS[status], code: status }, { status: status === "cutoff" ? 422 : 400 });
  }
  if (new Set(r.tables).size !== r.tables.length) {
    return Response.json({ error: "Mesas repetidas." }, { status: 400 });
  }

  const db = await getDb();
  try {
    const created = await db.transaction(async (tx) => {
      const all = await tx.select().from(tables);
      if (r.tables.some((n) => !all.some((t) => t.n === n))) throw new HttpError(400, "La mesa no existe.");

      const taken = new Set(await takenTables(tx, r.date, all.map((t) => t.n)));
      if (r.tables.some((n) => taken.has(n))) throw new HttpError(409, TAKEN);
      // Misma regla que muestra el sitio: solo se acepta una de las opciones ofrecidas para ese grupo.
      const { options } = seatingOptions(all.filter((t) => !taken.has(t.n)), r.people);
      if (!isOffered(options, r.tables)) {
        throw new HttpError(400, "Esas mesas no están disponibles para ese grupo. Elegí otra opción.", "unavailable");
      }

      const groupId = r.tables.length > 1 ? crypto.randomUUID() : null;
      const rows = await tx
        .insert(reservations)
        .values(
          [...r.tables].sort((a, b) => a - b).map((tableN) => ({
            date: r.date,
            turn: TURN.id,
            time: TURN.time,
            name: r.name,
            phone: r.phone,
            people: r.people,
            tableN,
            groupId,
            status: "pend" as const,
            source: "web" as const,
            note: r.comment,
          })),
        )
        .returning({ id: reservations.id });
      return rows[0];
    });
    return Response.json({ id: created.id, status: "pend" }, { status: 201 });
  } catch (err) {
    if (err instanceof HttpError) return Response.json({ error: err.message, code: err.code }, { status: err.status });
    if (isUniqueViolation(err)) return Response.json({ error: TAKEN }, { status: 409 });
    console.error("[reservations] error", err);
    return Response.json({ error: "No pudimos guardar la reserva. Probá de nuevo." }, { status: 500 });
  }
}
