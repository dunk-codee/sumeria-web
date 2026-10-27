/** Fechas del local: siempre en hora de Argentina, como texto ISO "YYYY-MM-DD". */
export const TZ = "America/Argentina/Buenos_Aires";

export const DOW = ["DOM", "LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB"];
export const DOW_LONG = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
export const MON = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
export const MON_LONG = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

/** Fecha de hoy en Argentina (ISO). */
export function todayISO(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

/** Hora actual en Argentina, "HH:MM". */
export function nowTime(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("es-AR", { timeZone: TZ, hour: "2-digit", minute: "2-digit", hour12: false }).format(now);
}

/** Interpreta un ISO como fecha de calendario (sin corrimiento de zona). */
export function parseISO(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12));
}

export function addDays(iso: string, n: number): string {
  const d = parseISO(iso);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export function nextDays(fromISO: string, count = 7): string[] {
  return Array.from({ length: count }, (_, i) => addDays(fromISO, i));
}

export function parts(iso: string) {
  const d = parseISO(iso);
  return { dow: d.getUTCDay(), day: d.getUTCDate(), month: d.getUTCMonth(), year: d.getUTCFullYear() };
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** "Lunes 26 de octubre" */
export function longDate(iso: string): string {
  const p = parts(iso);
  return `${cap(DOW_LONG[p.dow])} ${p.day} de ${MON_LONG[p.month]}`;
}

/** "LUN 26 oct" */
export function shortDate(iso: string): string {
  const p = parts(iso);
  return `${DOW[p.dow]} ${p.day} ${MON[p.month]}`;
}

/** "26 oct" */
export function dayMonth(iso: string): string {
  const p = parts(iso);
  return `${p.day} ${MON[p.month]}`;
}

export function isISODate(s: unknown): s is string {
  return typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(parseISO(s).getTime());
}
