import type { CSSProperties, ReactNode, Ref } from "react";
import type { PlanData } from "@/lib/data";
import { cx } from "@/lib/format";
import { boxStyle, FIXTURE_CLASS } from "@/lib/plan";

export type PlanTable = {
  n: number;
  x: number;
  y: number;
  w: number;
  h: number;
  round: boolean;
  className: string;
  content: ReactNode;
  aria?: string;
  disabled?: boolean;
  onClick?: () => void;
  onPointerDown?: (e: React.PointerEvent) => void;
  style?: CSSProperties;
  /** Clases de las sillas (relleno + borde). Si falta, usa las neutras. */
  chair?: string;
  /** Capacidad = cantidad de sillas. Si falta, no se dibujan. */
  capacity?: number;
};

/**
 * Cuadro que encierra mesas que van juntas. `active`: el par elegido (borde sólido);
 * si no, es una opción (punteado). Con `onClick` el cuadro es un botón.
 */
export type PlanGroup = { key: string; tables: number[]; active?: boolean; onClick?: () => void; aria?: string };

const CHAIR_T = 9; // grosor visible de la silla (px)
const CHAIR_GAP = 2; // aire entre silla y tablero (px)

type Side = "t" | "b" | "l" | "r";
type Chair = { style: CSSProperties };

/** Reparte `k` sillas a lo largo de un lado del tablero. */
function sideChairs(side: Side, k: number): Chair[] {
  const horiz = side === "t" || side === "b";
  const len = `min(20px, ${(72 / k).toFixed(1)}%)`;
  const off = -(CHAIR_T + CHAIR_GAP);
  return Array.from({ length: k }, (_, i) => {
    const at = `${(((i + 0.5) / k) * 100).toFixed(2)}%`;
    return {
      style: horiz
        ? { left: at, [side === "t" ? "top" : "bottom"]: off, width: len, height: CHAIR_T, transform: "translateX(-50%)" }
        : { top: at, [side === "l" ? "left" : "right"]: off, height: len, width: CHAIR_T, transform: "translateY(-50%)" },
    };
  });
}

/** Distancia (unidades del plano) por debajo de la cual dos mesas se consideran pegadas. */
const TOUCH = 0.5;

/**
 * Lados de la mesa (en pantalla) que tocan a otra mesa: ahí no van sillas.
 * Se calcula en coordenadas del plano; en portrait los ejes se intercambian (x → arriba/abajo, y → izquierda/derecha).
 */
function touchingSides(t: PlanTable, all: PlanTable[], portrait: boolean): Set<Side> {
  const out = new Set<Side>();
  for (const o of all) {
    if (o.n === t.n) continue;
    const overlapY = Math.min(t.y + t.h, o.y + o.h) - Math.max(t.y, o.y) > TOUCH;
    const overlapX = Math.min(t.x + t.w, o.x + o.w) - Math.max(t.x, o.x) > TOUCH;
    if (overlapY && Math.abs(o.x - (t.x + t.w)) < TOUCH) out.add(portrait ? "b" : "r");
    if (overlapY && Math.abs(t.x - (o.x + o.w)) < TOUCH) out.add(portrait ? "t" : "l");
    if (overlapX && Math.abs(o.y - (t.y + t.h)) < TOUCH) out.add(portrait ? "r" : "b");
    if (overlapX && Math.abs(t.y - (o.y + o.h)) < TOUCH) out.add(portrait ? "l" : "t");
  }
  return out;
}

/** Posiciones de sillas según forma y capacidad (w x h = medidas en pantalla); `blocked`: lados pegados a otra mesa. */
function chairsFor(n: number, round: boolean, w: number, h: number, blocked: Set<Side> = new Set()): Chair[] {
  if (n < 1) return [];
  if (round) {
    return Array.from({ length: n }, (_, i) => {
      const a = (-90 + (360 / n) * i) * (Math.PI / 180);
      const c = Math.cos(a);
      const s = Math.sin(a);
      const d = CHAIR_T / 2 + CHAIR_GAP;
      return {
        style: {
          left: `calc(50% + ${(c * 50).toFixed(2)}% + ${(c * d).toFixed(2)}px)`,
          top: `calc(50% + ${(s * 50).toFixed(2)}% + ${(s * d).toFixed(2)}px)`,
          width: 17,
          height: CHAIR_T,
          transform: `translate(-50%, -50%) rotate(${((a * 180) / Math.PI + 90).toFixed(1)}deg)`,
        },
      };
    });
  }
  const ratio = w / h;
  if (ratio > 1.3 || ratio < 0.77) {
    // Alargada: sillas repartidas sobre los lados largos.
    const [a, b]: [Side, Side] = w >= h ? ["t", "b"] : ["l", "r"];
    return [...sideChairs(a, Math.ceil(n / 2)), ...sideChairs(b, Math.floor(n / 2))];
  }
  // Cuadrada: reparto por turnos entre los lados libres (2 en lados opuestos, 4 una por lado).
  const free = (["t", "b", "l", "r"] as Side[]).filter((s) => !blocked.has(s));
  const sides: Side[] = free.length ? free : ["t", "b", "l", "r"];
  const counts: Record<Side, number> = { t: 0, b: 0, l: 0, r: 0 };
  for (let i = 0; i < n; i++) counts[sides[i % sides.length]]++;
  return sides.flatMap((s) => sideChairs(s, counts[s]));
}

/**
 * Plano del salón (vista desde arriba). Coordenadas en %: x 0–100, y 0–70.
 * `portrait` rota el plano para mobile (alto > ancho).
 */
export function FloorPlan({
  fixtures,
  tables,
  groups = [],
  portrait = false,
  className,
  grid = "dots",
  fixtureTone = "site",
  containerRef,
  containerProps,
}: {
  fixtures: PlanData["fixtures"];
  tables: PlanTable[];
  groups?: PlanGroup[];
  portrait?: boolean;
  className?: string;
  grid?: "dots" | "lines";
  fixtureTone?: "site" | "panel";
  containerRef?: Ref<HTMLDivElement>;
  containerProps?: React.HTMLAttributes<HTMLDivElement>;
}) {
  return (
    <div
      ref={containerRef}
      {...containerProps}
      className={cx(
        "relative w-full border",
        portrait ? "aspect-7/10" : "aspect-10/7",
        grid === "dots"
          ? "bg-dots border-bone/40"
          : "border-bone/35 bg-ink bg-[linear-gradient(rgba(244,241,236,.05)_1px,transparent_1px),linear-gradient(90deg,rgba(244,241,236,.05)_1px,transparent_1px)] bg-size-[5%_7.142%]",
        className,
      )}
    >
      {fixtures.map((f) => (
        <div
          key={f.id}
          style={boxStyle(f, portrait)}
          className={cx(
            "pointer-events-none absolute flex items-center justify-center text-center font-mono text-[9.5px] tracking-[.08em] uppercase",
            fixtureTone === "site" ? "text-bone/55" : "text-bone/50",
            FIXTURE_CLASS[f.kind],
            portrait && f.kind === "label" && "[writing-mode:vertical-rl]",
          )}
        >
          {f.label}
        </div>
      ))}
      {groups.map((g) => {
        const style = groupBox(tables.filter((t) => g.tables.includes(t.n)), portrait);
        if (!style) return null;
        const cls = cx(
          "absolute box-content -m-3 rounded-lg border-2 p-3 transition-colors duration-150 motion-reduce:transition-none",
          g.active ? "border-solid border-sumeria bg-sumeria/15" : "border-dashed border-sumeria/70 bg-sumeria/5 hover:bg-sumeria/15",
        );
        // Los cuadros van debajo de las mesas: tocando la mesa compañera también se elige el par.
        return g.onClick ? (
          <button key={g.key} type="button" style={style} onClick={g.onClick} aria-label={g.aria} aria-pressed={!!g.active} className={cx(cls, "cursor-pointer")} />
        ) : (
          <div key={g.key} aria-hidden style={style} className={cx(cls, "pointer-events-none")} />
        );
      })}
      {tables.map((t) => {
        const chairs = t.capacity
          ? chairsFor(t.capacity, t.round, portrait ? t.h : t.w, portrait ? t.w : t.h, t.round ? undefined : touchingSides(t, tables, portrait))
          : [];
        return chairs.length ? (
          <div key={`c${t.n}`} aria-hidden style={boxStyle(t, portrait)} className="pointer-events-none absolute">
            {chairs.map((c, i) => (
              <span
                key={i}
                style={c.style}
                className={cx("absolute rounded-[3px] border transition-colors duration-150 motion-reduce:transition-none", t.chair ?? "border-bone/40 bg-bone/15")}
              />
            ))}
          </div>
        ) : null;
      })}
      {tables.map((t) => {
        const common = {
          style: { ...boxStyle(t, portrait), ...t.style },
          className: cx(
            "absolute isolate box-border flex flex-col items-center justify-center gap-px overflow-hidden shadow-[0_3px_7px_rgba(0,0,0,.5),inset_0_0_0_3px_rgba(244,241,236,.07)] transition-colors duration-150 motion-reduce:transition-none",
            t.round ? "rounded-full" : "rounded-md",
            t.className,
          ),
        };
        return t.onPointerDown ? (
          <div key={t.n} {...common} onPointerDown={t.onPointerDown} role="button" tabIndex={0} aria-label={t.aria} onClick={t.onClick}>
            <Grain round={t.round} />
            {t.content}
          </div>
        ) : (
          <button
            key={t.n}
            type="button"
            {...common}
            aria-label={t.aria}
            aria-disabled={t.disabled || undefined}
            onClick={t.onClick}
            className={cx(common.className, t.disabled ? "cursor-not-allowed" : "cursor-pointer")}
          >
            <Grain round={t.round} />
            {t.content}
          </button>
        );
      })}
    </div>
  );
}

/** Veta sutil del tablero: líneas muy tenues bajo el contenido. */
function Grain({ round }: { round: boolean }) {
  return (
    <span
      aria-hidden
      className={cx(
        "pointer-events-none absolute inset-0 -z-10 bg-[repeating-linear-gradient(94deg,rgba(244,241,236,.05)_0_1px,transparent_1px_6px)]",
        round ? "rounded-full" : "rounded-md",
      )}
    />
  );
}

/** Caja (en %) que abarca a las mesas de un grupo; null si hay menos de dos. */
function groupBox(g: PlanTable[], portrait: boolean): CSSProperties | null {
  if (g.length < 2) return null;
  const x1 = Math.min(...g.map((t) => t.x));
  const y1 = Math.min(...g.map((t) => t.y));
  const x2 = Math.max(...g.map((t) => t.x + t.w));
  const y2 = Math.max(...g.map((t) => t.y + t.h));
  return boxStyle({ x: x1, y: y1, w: x2 - x1, h: y2 - y1 }, portrait);
}
