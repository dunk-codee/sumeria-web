/**
 * Turno único de reserva. Para cambiar el horario basta con editar esta constante.
 * La columna `reservations.turn` se conserva y vale siempre `TURN.id` (0).
 */
export const TURN = {
  id: 0,
  name: "Reservas",
  /** Hora que se guarda en la reserva y se usa en el mensaje de confirmación. */
  time: "19:30",
  /** Solo se muestra la hora de inicio: no hay horario límite. */
  range: "Desde las 19:30",
} as const;

/** Minutos de tardanza que se toleran antes de liberar la mesa. */
export const TOLERANCE_MIN = 30;

/** Personas máximas por reserva web (grupos más grandes, por WhatsApp). */
export const MAX_PEOPLE = 8;

/** Hora argentina ("HH:MM") desde la que ya no se reserva por la web para el mismo día. */
export const SAME_DAY_CUTOFF = "19:30";
