export type Turn = { id: 0 | 1; name: string; time: string; range: string };

/** Turnos de reserva: 1° 20:00–21:45, 2° 22:00–00:00. */
export const TURNS: readonly Turn[] = [
  { id: 0, name: "Primer turno", time: "20:00", range: "20:00 a 21:45" },
  { id: 1, name: "Segundo turno", time: "22:00", range: "22:00 a 00:00" },
] as const;

export const turnOf = (id: number): Turn => TURNS[id === 0 ? 0 : 1];

/** Turno en curso según la hora ("HH:MM"): hasta las 21:50 se muestra el primero. */
export const currentTurn = (time: string): 0 | 1 => (time >= "05:00" && time < "21:50" ? 0 : 1);

/** Personas máximas por reserva web (grupos más grandes, por WhatsApp). */
export const MAX_PEOPLE = 8;
/** Días hacia adelante que se pueden reservar desde el sitio (incluye hoy). */
export const BOOKING_DAYS = 7;
