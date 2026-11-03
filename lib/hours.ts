import { parts } from "./dates";
import type { DayHours } from "./schema";

/** Orden de los días en pantalla: de lunes a domingo (`day` usa 0 = domingo, como `Date#getDay`). */
export const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0] as const;
export const DAY_NAMES = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"] as const;

const day = (d: number, from: string, to: string): DayHours => ({ day: d, closed: false, from, to, ordersFrom: from });

/** Horario por defecto (el que pidió el cliente). Se edita en el panel → Datos del local. */
export const DEFAULT_WEEK: DayHours[] = [
  day(0, "20:00", "23:00"),
  day(1, "19:30", "23:00"),
  day(2, "19:30", "23:00"),
  day(3, "19:30", "23:00"),
  day(4, "19:30", "23:00"),
  day(5, "19:30", "23:30"),
  day(6, "19:30", "23:30"),
];

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;

/**
 * Normaliza lo guardado en `settings.hours`: acepta el formato actual (7 días) y el viejo (salón / pedidos / reservas,
 * un solo horario para todos los días), así las filas existentes siguen andando sin migración.
 */
export function weekOf(raw: unknown): DayHours[] {
  const list = Array.isArray(raw) ? raw : [];
  const rows = list.filter(
    (r): r is DayHours =>
      !!r && typeof r === "object" && Number.isInteger((r as DayHours).day) && HHMM.test((r as DayHours).from) && HHMM.test((r as DayHours).to),
  );
  if (rows.length === 7) {
    return WEEK_ORDER.map((d) => {
      const r = rows.find((x) => x.day === d) ?? DEFAULT_WEEK.find((x) => x.day === d)!;
      return { day: d, closed: !!r.closed, from: r.from, to: r.to, ordersFrom: HHMM.test(r.ordersFrom) ? r.ordersFrom : r.from };
    }).sort((a, b) => a.day - b.day);
  }
  // Formato viejo: se conserva la hora de inicio de pedidos que tenían cargada.
  const legacy = list.find((r) => r && typeof r === "object" && (r as { key?: string }).key === "pedidos") as { from?: string } | undefined;
  const legacyFrom = legacy?.from && HHMM.test(legacy.from) ? legacy.from : null;
  return DEFAULT_WEEK.map((d) => ({ ...d, ordersFrom: legacyFrom ?? d.ordersFrom }));
}

/** Días de lunes a domingo, en el orden en que se muestran. */
export function weekByOrder(week: DayHours[]): DayHours[] {
  return WEEK_ORDER.map((d) => week.find((x) => x.day === d)!);
}

/** Junta días seguidos con el mismo horario: "Lunes a jueves", "Viernes y sábados", "Domingos"… */
export function groupedWeek(week: DayHours[]): { days: string; closed: boolean; from: string; to: string }[] {
  const groups: { idx: number[]; closed: boolean; from: string; to: string }[] = [];
  WEEK_ORDER.forEach((d, i) => {
    const w = week.find((x) => x.day === d)!;
    const last = groups[groups.length - 1];
    if (last && last.closed === w.closed && (w.closed || (last.from === w.from && last.to === w.to))) last.idx.push(i);
    else groups.push({ idx: [i], closed: w.closed, from: w.from, to: w.to });
  });
  return groups.map((g) => {
    const names = g.idx.map((i) => DAY_NAMES[WEEK_ORDER[i]]);
    const pl = (n: string) => (n.endsWith("s") ? n : `${n}s`);
    let days: string;
    if (names.length === 1) days = pl(names[0]);
    else if (names.length === 2) days = `${pl(names[0])} y ${pl(names[1]).toLowerCase()}`;
    else days = `${names[0]} a ${names[names.length - 1].toLowerCase()}`;
    return { days, closed: g.closed, from: g.from, to: g.to };
  });
}

/**
 * "desde las 19:30; domingos desde las 20:00": la hora que se repite más y, aparte, los días que arrancan distinto.
 * `uniform` es true si todos los días (y ninguno cerrado) arrancan igual.
 */
function fromByDay(week: DayHours[], pick: (d: DayHours) => string) {
  const open = week.filter((d) => !d.closed);
  const times = [...new Set(open.map(pick))];
  const count = (t: string) => open.filter((d) => pick(d) === t).length;
  const main = [...times].sort((a, b) => count(b) - count(a) || a.localeCompare(b))[0] ?? "19:30";
  const extras = times
    .filter((t) => t !== main)
    .sort()
    .map((t) => {
      const names = WEEK_ORDER.filter((d) => open.some((x) => x.day === d && pick(x) === t)).map((d) => DAY_NAMES[d].toLowerCase());
      const plural = (n: string) => (n.endsWith("s") ? n : `${n}s`);
      const label = names.length === 1 ? plural(names[0]) : `${names.slice(0, -1).map(plural).join(", ")} y ${plural(names[names.length - 1])}`;
      return `${label} desde las ${t}`;
    });
  return { main, extras, uniform: open.length === 7 && extras.length === 0 };
}

/** "Todos los días desde las 19:30" o, si cambia: "Desde las 19:30; domingos desde las 20:00". */
export function openFromText(week: DayHours[]): string {
  const s = fromByDay(week, (d) => d.from);
  return s.uniform ? `Todos los días desde las ${s.main}` : [`Desde las ${s.main}`, ...s.extras].join("; ");
}

/** "desde las 19:30; domingos desde las 20:00" para la intro de la carta. */
export function ordersFromText(week: DayHours[]): string {
  const s = fromByDay(week, (d) => d.ordersFrom);
  return [`desde las ${s.main}`, ...s.extras].join("; ");
}

export type OrdersStatus = { ok: true } | { ok: false; reason: "closed" } | { ok: false; reason: "early"; from: string };

/** ¿Se pueden enviar pedidos ahora? `time` es "HH:MM" en hora de Argentina y `iso` la fecha de hoy ("YYYY-MM-DD"). */
export function ordersStatus(week: DayHours[], iso: string, time: string): OrdersStatus {
  const today = week.find((d) => d.day === parts(iso).dow);
  if (!today || today.closed) return { ok: false, reason: "closed" };
  if (time < today.ordersFrom) return { ok: false, reason: "early", from: today.ordersFrom };
  return { ok: true };
}

/** Texto para el cliente cuando todavía no se pueden enviar pedidos (null si se puede). */
export function ordersBlockMessage(st: OrdersStatus): string | null {
  if (st.ok) return null;
  return st.reason === "closed"
    ? "Hoy no tomamos pedidos. Podés dejar armado el pedido y enviarlo otro día."
    : `Todavía no tomamos pedidos: empezamos a las ${st.from}. Podés ir armando el pedido y enviarlo a partir de esa hora.`;
}

/** Hora desde la que se reserva ese día: la de apertura de ese día de la semana (domingos 20:00, el resto 19:30 por defecto). */
export function reservationTime(week: DayHours[], iso: string): string {
  return week.find((d) => d.day === parts(iso).dow)?.from ?? "19:30";
}

/** "Desde las 19:30" para ese día. */
export function reservationRange(week: DayHours[], iso: string): string {
  return `Desde las ${reservationTime(week, iso)}`;
}

/** "Reservás desde las 19:30; domingos desde las 20:00." (si todos los días abren igual, solo la primera parte). */
export function reservationFromText(week: DayHours[]): string {
  const s = fromByDay(week, (d) => d.from);
  return `Reservás ${[`desde las ${s.main}`, ...s.extras].join("; ")}.`;
}
