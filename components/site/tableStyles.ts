/**
 * Estados de mesa en el sitio: siempre borde + relleno + etiqueta, nunca solo color.
 */
export type SiteTableKind = "free" | "small" | "pend" | "res" | "sel";

export const SITE_TABLE: Record<SiteTableKind, string> = {
  free: "border-[1.5px] border-solid border-bone bg-bone/5 text-bone",
  small: "border border-dotted border-bone/40 bg-transparent text-bone/45",
  pend: "border-[1.5px] border-dashed border-kraft text-kraft bg-[repeating-linear-gradient(45deg,rgba(216,188,147,.24)_0_2px,transparent_2px_7px)]",
  res: "border border-smoke-3 bg-smoke-1 text-bone/50",
  sel: "border-2 border-sumeria bg-sumeria-dark text-white",
};

export const SITE_TABLE_ARIA: Record<SiteTableKind, string> = {
  free: "disponible",
  small: "disponible, capacidad insuficiente",
  pend: "pendiente de confirmar",
  res: "reservada u ocupada",
  sel: "seleccionada",
};
