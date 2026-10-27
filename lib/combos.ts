/**
 * Combinación de mesas para grupos que no entran en una sola.
 *
 * Criterio (constantes de abajo, fáciles de ajustar):
 * - Hasta COMBO_MAX_TABLES mesas por combinación.
 * - Las mesas tienen que estar juntas: la separación entre los bordes de dos mesas
 *   (en unidades del plano, x 0–100 / y 0–70) no puede superar COMBO_MAX_GAP, y toda la
 *   combinación tiene que ser "conexa" (cada mesa toca a otra de la combinación).
 *   `tables.location` es texto libre ("Salón, contra la pared"), no una zona, por eso
 *   no se usa como criterio: la cercanía en el plano es lo que manda.
 * - Sin desperdicio: se descarta la combinación si, quitando la mesa más chica, el grupo
 *   seguiría entrando (sobrante >= capacidad de alguna mesa).
 * - Orden: menor sobrante, menos mesas, mesas más pegadas.
 * - Se ofrecen solo si desperdician menos que la mejor mesa individual libre (ver `offerCombos`).
 */

export const COMBO_MAX_TABLES = 3;
export const COMBO_MAX_GAP = 8;
export const COMBO_MAX_OPTIONS = 8;

export type ComboTable = { n: number; capacity: number; x: number; y: number; w: number; h: number };
export type Combo = { tables: number[]; capacity: number; surplus: number };

/** Separación entre los bordes de dos mesas (0 si se tocan o solapan). */
export function tableGap(a: ComboTable, b: ComboTable): number {
  const gx = Math.max(0, Math.max(a.x, b.x) - Math.min(a.x + a.w, b.x + b.w));
  const gy = Math.max(0, Math.max(a.y, b.y) - Math.min(a.y + a.h, b.y + b.h));
  return Math.hypot(gx, gy);
}

function connected(ts: ComboTable[]): boolean {
  const seen = new Set([0]);
  const queue = [0];
  while (queue.length) {
    const i = queue.pop()!;
    for (let j = 0; j < ts.length; j++) {
      if (!seen.has(j) && tableGap(ts[i], ts[j]) <= COMBO_MAX_GAP) {
        seen.add(j);
        queue.push(j);
      }
    }
  }
  return seen.size === ts.length;
}

/** ¿Es una combinación válida (2–3 mesas juntas, alcanza y sin desperdicio)? No mira disponibilidad. */
export function isComboViable(ts: ComboTable[], people: number): boolean {
  if (ts.length < 2 || ts.length > COMBO_MAX_TABLES) return false;
  if (new Set(ts.map((t) => t.n)).size !== ts.length) return false;
  const total = ts.reduce((a, t) => a + t.capacity, 0);
  if (total < people) return false;
  if (total - people >= Math.min(...ts.map((t) => t.capacity))) return false;
  return connected(ts);
}

/** Combinaciones posibles con las mesas libres recibidas, ya ordenadas y limitadas. */
export function findCombos(free: ComboTable[], people: number): Combo[] {
  const list = [...free].sort((a, b) => a.n - b.n);
  const found: { combo: Combo; gap: number }[] = [];
  const consider = (ts: ComboTable[]) => {
    if (!isComboViable(ts, people)) return;
    const capacity = ts.reduce((a, t) => a + t.capacity, 0);
    let gap = 0;
    for (let i = 0; i < ts.length; i++) for (let j = i + 1; j < ts.length; j++) gap += tableGap(ts[i], ts[j]);
    found.push({ combo: { tables: ts.map((t) => t.n), capacity, surplus: capacity - people }, gap });
  };
  for (let i = 0; i < list.length; i++) {
    for (let j = i + 1; j < list.length; j++) {
      consider([list[i], list[j]]);
      for (let k = j + 1; k < list.length && COMBO_MAX_TABLES >= 3; k++) consider([list[i], list[j], list[k]]);
    }
  }
  found.sort((a, b) => a.combo.surplus - b.combo.surplus || a.combo.tables.length - b.combo.tables.length || a.gap - b.gap);
  return found.slice(0, COMBO_MAX_OPTIONS).map((f) => f.combo);
}

/**
 * Combinaciones que conviene mostrar: solo las que desperdician menos lugares que la mejor
 * mesa libre individual (o todas si ninguna mesa sola alcanza). Ej.: 6 personas con la
 * de 6 ocupada y la de 8 libre → se ofrece 2 + 4 (sobrante 0) antes que la de 8 (sobrante 2).
 */
export function offerCombos(free: ComboTable[], people: number): Combo[] {
  const fits = free.filter((t) => t.capacity >= people);
  const bestSingleSurplus = fits.length ? Math.min(...fits.map((t) => t.capacity - people)) : Infinity;
  return findCombos(free, people).filter((c) => c.surplus < bestSingleSurplus);
}
