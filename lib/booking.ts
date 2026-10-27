import { addDays, nowTime, todayISO } from "./dates";
import { SAME_DAY_CUTOFF } from "./turns";

/**
 * Reglas de qué días se pueden reservar desde el sitio. Todo es puro (recibe
 * "ahora" por parámetro) para poder testearlo y usarlo igual en servidor y cliente.
 */

export type BookingConfig = {
  /** Primer día reservable (ISO). Null: desde hoy. */
  from: string | null;
  /** Último día reservable (ISO). Null: hoy + DEFAULT_AHEAD_DAYS. */
  to: string | null;
  /** Días puntuales cerrados dentro del rango (ISO). */
  blocked: string[];
};

export const DEFAULT_BOOKING: BookingConfig = { from: null, to: null, blocked: [] };
/** Sin rango configurado se puede reservar de hoy a hoy + 7 días. */
export const DEFAULT_AHEAD_DAYS = 7;
/** Tope de días que puede abarcar el rango (evita listas enormes en el selector). */
export const MAX_BOOKING_SPAN = 180;

/** Rango efectivo (inclusive). Nunca empieza antes de hoy. */
export function bookingRange(cfg: BookingConfig, today: string): { from: string; to: string } {
  const from = cfg.from && cfg.from > today ? cfg.from : today;
  const to = cfg.to ?? addDays(from, DEFAULT_AHEAD_DAYS);
  return { from, to };
}

export type BookingDay = { date: string; blocked: boolean };

/** Todos los días del rango efectivo, marcando los bloqueados. */
export function bookingDays(cfg: BookingConfig, today: string): BookingDay[] {
  const { from, to } = bookingRange(cfg, today);
  const out: BookingDay[] = [];
  for (let d = from, i = 0; d <= to && i < MAX_BOOKING_SPAN; d = addDays(d, 1), i++) {
    out.push({ date: d, blocked: cfg.blocked.includes(d) });
  }
  return out;
}

/** ¿Ya pasó el corte del mismo día (19:30 hora argentina) para esa fecha? */
export function isPastCutoff(date: string, now: Date = new Date()): boolean {
  return date === todayISO(now) && nowTime(now) >= SAME_DAY_CUTOFF;
}

export type BookingStatus = "ok" | "out_of_range" | "blocked" | "cutoff";

/** Estado de una fecha para reservar por la web. */
export function bookingStatus(date: string, cfg: BookingConfig, now: Date = new Date()): BookingStatus {
  const today = todayISO(now);
  const { from, to } = bookingRange(cfg, today);
  if (date < from || date > to) return "out_of_range";
  if (cfg.blocked.includes(date)) return "blocked";
  if (isPastCutoff(date, now)) return "cutoff";
  return "ok";
}

export const BOOKING_ERRORS: Record<Exclude<BookingStatus, "ok">, string> = {
  out_of_range: "Esa fecha no está disponible para reservar online.",
  blocked: "Ese día no tomamos reservas online. Probá con otro o escribinos por WhatsApp.",
  cutoff: "Las reservas online para hoy cierran a las 19:30. Consultanos por WhatsApp.",
};
