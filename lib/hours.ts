import type { HoursRow } from "./schema";

const FALLBACK: Record<HoursRow["key"], HoursRow> = {
  salon: { key: "salon", label: "Salón", from: "19:30", to: "00:00" },
  pedidos: { key: "pedidos", label: "Pedidos delivery y take away", from: "19:30", to: "23:30" },
  reservas: { key: "reservas", label: "Reservas · turnos", from: "20:00", to: "22:00" },
};

export function hoursOf(s: { hours: HoursRow[] }, key: HoursRow["key"]): HoursRow {
  return s.hours.find((h) => h.key === key) ?? FALLBACK[key];
}
