/**
 * Estados de mesa en el sitio: siempre borde + relleno + etiqueta, nunca solo color.
 */
/**
 * - `anchor`: la mesa que tocaste para juntar con otra (todavía falta elegir con cuál).
 * - `partner`: mesa que se puede juntar con la del ancla.
 */
export type SiteTableKind = "free" | "small" | "pend" | "res" | "sel" | "anchor" | "partner";

export const SITE_TABLE: Record<SiteTableKind, string> = {
  free: "border-[1.5px] border-solid border-bone bg-bone/5 text-bone",
  small: "border border-dotted border-bone/40 bg-transparent text-bone/45",
  pend: "border-[1.5px] border-dashed border-kraft text-kraft bg-[repeating-linear-gradient(45deg,rgba(216,188,147,.24)_0_2px,transparent_2px_7px)]",
  res: "border border-smoke-3 bg-smoke-1 text-bone/50",
  sel: "border-2 border-sumeria bg-sumeria-dark text-white",
  anchor: "border-2 border-double border-sumeria bg-sumeria/25 text-bone",
  partner: "border-[1.5px] border-dashed border-sumeria-light bg-bone/5 text-bone",
};

export const SITE_TABLE_ARIA: Record<SiteTableKind, string> = {
  free: "disponible",
  small: "no disponible para este grupo",
  pend: "pendiente de confirmar",
  res: "reservada u ocupada",
  sel: "seleccionada",
  anchor: "elegida, falta elegir con cuál juntarla",
  partner: "se puede juntar con la mesa elegida",
};

/** Sillas por estado: repiten el trazo de la mesa para que el estado no dependa solo del color. */
export const SITE_CHAIR: Record<SiteTableKind, string> = {
  free: "border-bone/80 bg-bone/30",
  small: "border-dotted border-bone/35 bg-transparent",
  pend: "border-dashed border-kraft/80 bg-kraft/15",
  res: "border-smoke-3 bg-smoke-2",
  sel: "border-sumeria bg-sumeria-dark",
  anchor: "border-sumeria bg-sumeria/30",
  partner: "border-dashed border-sumeria-light/80 bg-bone/15",
};
