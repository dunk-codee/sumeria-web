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
  /** Mesa que forma parte de una combinación: se dibuja un contorno que agrupa a todas las marcadas. */
  grouped?: boolean;
  /** Capacidad = cantidad de sillas. Si falta, no se dibujan. */
  capacity?: number;
};

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

/** Posiciones de sillas según forma y capacidad (w x h = medidas en pantalla). */
function chairsFor(n: number, round: boolean, w: number, h: number): Chair[] {
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
  // Cuadrada: reparto por turnos entre los cuatro lados (2 en lados opuestos, 4 una por lado).
  const sides: Side[] = ["t", "b", "l", "r"];
  const counts: Record<Side, number> = { t: 0, b: 0, l: 0, r: 0 };
  for (let i = 0; i < n; i++) counts[sides[i % 4]]++;
  return sides.flatMap((s) => sideChairs(s, counts[s]));
}

/**
 * Plano del salón (vista desde arriba). Coordenadas en %: x 0–100, y 0–70.
 * `portrait` rota el plano para mobile (alto > ancho).
 */
export function FloorPlan({
  fixtures,
  tables,
  portrait = false,
  className,
  grid = "dots",
  fixtureTone = "site",
  containerRef,
  containerProps,
}: {
  fixtures: PlanData["fixtures"];
  tables: PlanTable[];
  portrait?: boolean;
  className?: string;
  grid?: "dots" | "lines";
  fixtureTone?: "site" | "panel";
  containerRef?: Ref<HTMLDivElement>;
  containerProps?: React.HTMLAttributes<HTMLDivElement>;
}) {
  const box = groupBox(tables, portrait);
  return (
    <div
      ref={containerRef}
      {...containerProps}
      className={cx(
        "relative w-full border",
        portrait ? "aspect-[7/10]" : "aspect-[10/7]",
        grid === "dots"
          ? "bg-dots border-bone/40"
          : "border-bone/35 bg-ink bg-[linear-gradient(rgba(244,241,236,.05)_1px,transparent_1px),linear-gradient(90deg,rgba(244,241,236,.05)_1px,transparent_1px)] bg-[length:5%_7.142%]",
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
      {box && (
        <div
          aria-hidden
          style={box}
          className="pointer-events-none absolute box-content -m-3 rounded-lg border-2 border-dashed border-sumeria/70 bg-sumeria/10 p-3"
        />
      )}
      {tables.map((t) => {
        const chairs = t.capacity ? chairsFor(t.capacity, t.round, portrait ? t.h : t.w, portrait ? t.w : t.h) : [];
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

/** Caja (en %) que abarca a las mesas de una combinación; null si hay menos de dos. */
function groupBox(tables: PlanTable[], portrait: boolean): CSSProperties | null {
  const g = tables.filter((t) => t.grouped);
  if (g.length < 2) return null;
  const x1 = Math.min(...g.map((t) => t.x));
  const y1 = Math.min(...g.map((t) => t.y));
  const x2 = Math.max(...g.map((t) => t.x + t.w));
  const y2 = Math.max(...g.map((t) => t.y + t.h));
  return boxStyle({ x: x1, y: y1, w: x2 - x1, h: y2 - y1 }, portrait);
}
