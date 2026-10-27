import { eq } from "drizzle-orm";
import { getDb, isUniqueViolation } from "@/lib/db";
import { reservations, tables } from "@/lib/schema";
import { turnOf } from "@/lib/turns";
import { inBookingWindow, reservationInput } from "@/lib/validation";

class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

/**
 * POST /api/reservations — crea una reserva web en estado Pendiente.
 * Corre en transacción; si la mesa ya fue tomada (índice único) responde 409.
 */
export async function POST(request: Request) {
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
  if (!inBookingWindow(r.date)) {
    return Response.json({ error: "Esa fecha no está disponible para reservar online." }, { status: 400 });
  }

  const db = await getDb();
  try {
    const created = await db.transaction(async (tx) => {
      const [table] = await tx.select().from(tables).where(eq(tables.n, r.tableN));
      if (!table) throw new HttpError(400, "La mesa no existe.");
      if (table.capacity < r.people) throw new HttpError(400, `La mesa ${r.tableN} es para ${table.capacity} personas.`);

      const [row] = await tx
        .insert(reservations)
        .values({
          date: r.date,
          turn: r.turn,
          time: turnOf(r.turn).time,
          name: r.name,
          phone: r.phone,
          people: r.people,
          tableN: r.tableN,
          status: "pend",
          source: "web",
          note: r.comment,
        })
        .returning({ id: reservations.id });
      return row;
    });
    return Response.json({ id: created.id, status: "pend" }, { status: 201 });
  } catch (err) {
    if (err instanceof HttpError) return Response.json({ error: err.message }, { status: err.status });
    if (isUniqueViolation(err)) {
      return Response.json({ error: "Alguien acaba de pedir esa mesa. Elegí otra." }, { status: 409 });
    }
    console.error("[reservations] error", err);
    return Response.json({ error: "No pudimos guardar la reserva. Probá de nuevo." }, { status: 500 });
  }
}
