import { addDays, nowTime, parseISO, parts, todayISO } from "./dates";
import { reservationTime } from "./hours";
import type { DayHours } from "./schema";
import { SAME_DAY_CUTOFF } from "./turns";

/**
 * Reglas de qué días se pueden reservar desde el sitio. Todo es puro (recibe
 * "ahora" por parámetro) para poder testearlo y usarlo igual en servidor y cliente.
 */

export type BookingConfig = {
  /**
   * Día en que se guardó el rango (ISO). Solo sirve para calcular `to - from`, o sea cuántos días hacia adelante se reserva.
   * Null (con `to` null): valor por defecto.
   */
  from: string | null;
  /** Fecha guardada junto con `from` (ver arriba). */
  to: string | null;
  /** Días puntuales cerrados dentro del rango (ISO). */
  blocked: string[];
};

export const DEFAULT_BOOKING: BookingConfig = { from: null, to: null, blocked: [] };
/** Sin rango configurado se puede reservar de hoy a hoy + 7 días. */
export const DEFAULT_AHEAD_DAYS = 7;
/** Tope de días que puede abarcar el rango (evita listas enormes en el selector). */
export const MAX_BOOKING_SPAN = 180;

/** Cuántos días hacia adelante se puede reservar (el rango se renueva solo cada día: siempre desde hoy). */
export function bookingAhead(cfg: Pick<BookingConfig, "from" | "to">): number {
  if (!cfg.from || !cfg.to) return DEFAULT_AHEAD_DAYS;
  const days = Math.round((parseISO(cfg.to).getTime() - parseISO(cfg.from).getTime()) / 86_400_000);
  return Math.min(Math.max(days, 0), MAX_BOOKING_SPAN - 1);
}

/** Rango efectivo (inclusive): de hoy a hoy + días de anticipación. Se corre solo cada día. */
export function bookingRange(cfg: BookingConfig, today: string): { from: string; to: string } {
  return { from: today, to: addDays(today, bookingAhead(cfg)) };
}

export type BookingDay = { date: string; blocked: boolean };

/** Todos los días del rango efectivo, marcando los bloqueados. */
export function bookingDays(cfg: BookingConfig, today: string, week?: DayHours[]): BookingDay[] {
  const { from, to } = bookingRange(cfg, today);
  const out: BookingDay[] = [];
  for (let d = from, i = 0; d <= to && i < MAX_BOOKING_SPAN; d = addDays(d, 1), i++) {
    out.push({ date: d, blocked: cfg.blocked.includes(d) || isClosedDay(week, d) });
  }
  return out;
}

/** ¿Ese día de la semana está marcado como cerrado en los horarios? */
function isClosedDay(week: DayHours[] | undefined, date: string): boolean {
  return !!week?.find((d) => d.day === parts(date).dow)?.closed;
}

/** ¿Ya pasó el corte del mismo día para esa fecha? El corte es la hora de apertura de ese día (19:30 si no se conoce el horario). */
export function isPastCutoff(date: string, now: Date = new Date(), week?: DayHours[]): boolean {
  const cutoff = week ? reservationTime(week, date) : SAME_DAY_CUTOFF;
  return date === todayISO(now) && nowTime(now) >= cutoff;
}

export type BookingStatus = "ok" | "out_of_range" | "blocked" | "cutoff";

/** Estado de una fecha para reservar por la web. */
export function bookingStatus(date: string, cfg: BookingConfig, now: Date = new Date(), week?: DayHours[]): BookingStatus {
  const today = todayISO(now);
  const { from, to } = bookingRange(cfg, today);
  if (date < from || date > to) return "out_of_range";
  if (cfg.blocked.includes(date) || isClosedDay(week, date)) return "blocked";
  if (isPastCutoff(date, now, week)) return "cutoff";
  return "ok";
}

export const BOOKING_ERRORS: Record<Exclude<BookingStatus, "ok">, string> = {
  out_of_range: "Esa fecha no está disponible para reservar online.",
  blocked: "Ese día no tomamos reservas online. Probá con otro o escribinos por WhatsApp.",
  cutoff: "Las reservas online para hoy ya cerraron. Consultanos por WhatsApp.",
};
