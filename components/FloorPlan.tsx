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
};

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
      {tables.map((t) => {
        const common = {
          style: { ...boxStyle(t, portrait), ...t.style },
          className: cx(
            "absolute box-border flex flex-col items-center justify-center gap-px overflow-hidden",
            t.round ? "rounded-full" : "rounded",
            t.className,
          ),
        };
        return t.onPointerDown ? (
          <div key={t.n} {...common} onPointerDown={t.onPointerDown} role="button" tabIndex={0} aria-label={t.aria} onClick={t.onClick}>
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
            {t.content}
          </button>
        );
      })}
    </div>
  );
}
