/**
 * Turno único de reserva. Para cambiar el horario basta con editar esta constante.
 * La columna `reservations.turn` se conserva y vale siempre `TURN.id` (0).
 */
export const TURN = {
  id: 0,
  name: "Reservas",
  /** Hora que se guarda en la reserva y se usa en el mensaje de confirmación. */
  time: "20:00",
  range: "20:00 a 23:00",
} as const;

/** Personas máximas por reserva web (grupos más grandes, por WhatsApp). */
export const MAX_PEOPLE = 8;

/** Hora argentina ("HH:MM") desde la que ya no se reserva por la web para el mismo día. */
export const SAME_DAY_CUTOFF = "19:30";
