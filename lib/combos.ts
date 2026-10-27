/**
 * Opciones de lugar para un grupo: una mesa sola o dos mesas juntas.
 *
 * Criterio (constantes de abajo, fáciles de ajustar):
 * - Como mucho COMBO_MAX_TABLES mesas por reserva (dos: es lo que muestra el plano con sus cuadros).
 * - Vecinas: B es la mesa libre más cercana a A en alguna dirección (arriba, abajo, izquierda o derecha;
 *   se decide por el eje dominante entre los centros), o al revés, y el borde a borde es ≤ NEAR_MAX_GAP.
 *   El límite deja afuera las mesas que tienen otra en el medio. Las pegadas (gap 0) siempre son vecinas.
 *   `tables.location` es texto libre, por eso no se usa: manda la posición en el plano.
 * - Sin desperdicio: un par se descarta si, quitando la mesa más chica, el grupo seguiría entrando.
 * - Pegadas primero: si algún par de mesas pegadas (borde a borde < JOINED_GAP) alcanza para el grupo, solo se
 *   ofrecen pares pegados (no se arman pares con mesas sueltas). El sitio además elige uno de entrada.
 * - Si no, pares vecinos (sin importar si una es mitad de un par pegado); los separados, por último.
 *   Ver `steps` en `seatingOptions`.
 * - Grupos chicos (≤ SMALL_GROUP_MAX): solo mesas sueltas si hay alguna libre; las mitades de un par pegado libre
 *   quedan para cuando no queda ninguna suelta.
 * - Pares vecinos solo si desperdician menos lugares que la mejor mesa sola; separados solo si no hay mesa sola.
 * - `tier`: `exact` si lo ofrecido son mesas solas o pares vecinos, `apart` si son pares separados (el local
 *   los junta), `none` si no hay lugar.
 * El sitio muestra estas opciones y el servidor acepta solo una de ellas (ver `POST /api/reservations`).
 */

export const COMBO_MAX_TABLES = 2;
export const NEAR_MAX_GAP = 12;
/** Mesas pegadas: misma tolerancia que usa FloorPlan para no dibujar sillas entre ellas. */
export const JOINED_GAP = 0.5;
/** Hasta esta cantidad de personas se ofrecen solo mesas sueltas (si hay alguna libre). */
export const SMALL_GROUP_MAX = 3;

export type ComboTable = { n: number; capacity: number; x: number; y: number; w: number; h: number };
export type SeatingTier = "exact" | "apart" | "none";
/** `joined`: par de mesas pegadas en el plano. `apart`: par de mesas separadas (el local las junta). */
export type SeatingOption = { tables: number[]; capacity: number; apart: boolean; joined: boolean };

/** Separación entre los bordes de dos mesas (0 si se tocan o solapan). */
export function tableGap(a: ComboTable, b: ComboTable): number {
  const gx = Math.max(0, Math.max(a.x, b.x) - Math.min(a.x + a.w, b.x + b.w));
  const gy = Math.max(0, Math.max(a.y, b.y) - Math.min(a.y + a.h, b.y + b.h));
  return Math.hypot(gx, gy);
}

type Dir = "l" | "r" | "u" | "d";

/** Dirección de B vista desde A, por el eje dominante entre los centros. */
function dirOf(a: ComboTable, b: ComboTable): Dir {
  const dx = b.x + b.w / 2 - (a.x + a.w / 2);
  const dy = b.y + b.h / 2 - (a.y + a.h / 2);
  return Math.abs(dx) >= Math.abs(dy) ? (dx < 0 ? "l" : "r") : dy < 0 ? "u" : "d";
}

/** Para cada mesa, su vecina más cercana en cada dirección (entre las recibidas). */
function nearestByDir(ts: ComboTable[]): Map<number, Set<number>> {
  const out = new Map<number, Set<number>>();
  for (const a of ts) {
    const best = new Map<Dir, { n: number; gap: number }>();
    for (const b of ts) {
      if (b.n === a.n) continue;
      const gap = tableGap(a, b);
      if (gap > NEAR_MAX_GAP) continue;
      const d = dirOf(a, b);
      const cur = best.get(d);
      if (!cur || gap < cur.gap) best.set(d, { n: b.n, gap });
    }
    out.set(a.n, new Set([...best.values()].map((v) => v.n)));
  }
  return out;
}

/** ¿Las mesas a y b son vecinas dentro de `ts` (las libres, o todo el plano)? */
export function areNeighbors(a: ComboTable, b: ComboTable, ts: ComboTable[]): boolean {
  const near = nearestByDir(ts);
  return !!(near.get(a.n)?.has(b.n) || near.get(b.n)?.has(a.n));
}

const fits = (cap: number, people: number) => cap >= people;
/** Par sin desperdicio: alcanza y, quitando la más chica, ya no alcanzaría. */
const pairFits = (a: ComboTable, b: ComboTable, people: number) =>
  a.capacity + b.capacity >= people && a.capacity + b.capacity - people < Math.min(a.capacity, b.capacity);

const option = (ts: ComboTable[], apart = false): SeatingOption => ({
  tables: ts.map((t) => t.n).sort((x, y) => x - y),
  capacity: ts.reduce((s, t) => s + t.capacity, 0),
  apart,
  joined: ts.length === 2 && tableGap(ts[0], ts[1]) < JOINED_GAP,
});

/** Opciones de lugar con las mesas libres, ya ordenadas (menos desperdicio primero). */
export function seatingOptions(free: ComboTable[], people: number): { tier: SeatingTier; options: SeatingOption[] } {
  const list = [...free].sort((a, b) => a.n - b.n);
  const bySurplus = (a: SeatingOption, b: SeatingOption) => a.capacity - b.capacity || a.tables.length - b.tables.length;

  // Grupos chicos: primero mesas sueltas, así no se rompe un par pegado (libre) que sirve para un grupo grande.
  // Si la compañera del par ya está tomada, esa mesa cuenta como suelta.
  const isJoinedHalf = (t: ComboTable) => list.some((o) => o.n !== t.n && tableGap(t, o) < JOINED_GAP);
  const fitting = list.filter((t) => fits(t.capacity, people));
  const loose = people <= SMALL_GROUP_MAX ? fitting.filter((t) => !isJoinedHalf(t)) : [];
  const singles = (loose.length ? loose : fitting).map((t) => option([t]));
  const near = nearestByDir(list);
  const nearPairs: SeatingOption[] = [];
  const farPairs: SeatingOption[] = [];
  for (let i = 0; i < list.length; i++) {
    for (let j = i + 1; j < list.length; j++) {
      const [a, b] = [list[i], list[j]];
      if (!pairFits(a, b, people)) continue;
      const isNear = near.get(a.n)?.has(b.n) || near.get(b.n)?.has(a.n);
      (isNear ? nearPairs : farPairs).push(option([a, b], !isNear));
    }
  }

  const bestSingle = singles.length ? Math.min(...singles.map((o) => o.capacity)) : Infinity;
  // Pares vecinos solo si desperdician menos que la mejor mesa sola; separados solo si no hay mesa sola.
  const nearOk = nearPairs.filter((o) => o.capacity < bestSingle);
  const farOk = singles.length ? [] : farPairs;
  /** Prioridad entre pares (se usa el primer grupo que tenga alguno): manda la cercanía, las separadas al final. */
  const steps: [SeatingTier, SeatingOption[]][] = [
    ["exact", nearOk.filter((o) => o.joined)], // pegadas que alcanzan
    ["exact", nearOk], // vecinas (sueltas o con una mesa de un par pegado, da igual)
    ["apart", farOk], // separadas, por último
  ];
  const [pairTier, pairs] = steps.find(([, ps]) => ps.length) ?? ["none", []];

  if (singles.length || pairs.length) {
    return { tier: singles.length ? "exact" : pairTier, options: [...singles, ...pairs.sort(bySurplus)].sort(bySurplus) };
  }
  return { tier: "none", options: [] };
}

/** Para el panel: ¿una reserva de dos mesas usa mesas que no son vecinas en el plano (hay que juntarlas)? */
export function isApart(tableNs: number[], planTables: ComboTable[]): boolean {
  if (tableNs.length < 2) return false;
  const [a, b] = tableNs.map((n) => planTables.find((t) => t.n === n));
  if (!a || !b) return false;
  return !areNeighbors(a, b, planTables);
}

/** ¿Las mesas pedidas son exactamente una de las opciones? */
export function isOffered(options: SeatingOption[], tables: number[]): boolean {
  const key = [...tables].sort((a, b) => a - b).join("-");
  return options.some((o) => o.tables.join("-") === key);
}
