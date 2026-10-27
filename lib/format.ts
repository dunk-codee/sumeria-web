/** $13.900 (es-AR, sin decimales). */
export const money = (n: number | string) => "$" + Math.round(Number(n) || 0).toLocaleString("es-AR");

/** "8" → "8 piezas"; "4 unidades" queda igual; vacío → "". */
export function piecesLabel(pieces: string | null | undefined): string {
  const p = (pieces ?? "").trim();
  if (!p) return "";
  return /^\d+$/.test(p) ? `${p} piezas` : p;
}

export const plural = (n: number, one: string, many: string) => (n === 1 ? one : many);

export function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

/** "Mesa 3" o "Mesas 2 + 4" (reservas con mesas combinadas). */
export function tablesLabel(tables: number[]): string {
  return tables.length > 1 ? `Mesas ${tables.join(" + ")}` : `Mesa ${tables[0]}`;
}
