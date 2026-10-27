import type { CSSProperties } from "react";
import type { FixtureKind, TableShape } from "./schema";

/** Alto lógico del plano: x va de 0 a 100 y y de 0 a 70. */
export const PLAN_H = 70;

type Box = { x: number; y: number; w: number; h: number };

/**
 * Posición absoluta en % dentro del plano.
 * En portrait (mobile) el plano se rota: se intercambian los ejes.
 */
export function boxStyle(e: Box, portrait = false): CSSProperties {
  return portrait
    ? { left: `${(e.y / PLAN_H) * 100}%`, top: `${e.x}%`, width: `${(e.h / PLAN_H) * 100}%`, height: `${e.w}%` }
    : { left: `${e.x}%`, top: `${(e.y / PLAN_H) * 100}%`, width: `${e.w}%`, height: `${(e.h / PLAN_H) * 100}%` };
}

/** Tamaño automático de la mesa según capacidad y forma. */
export function sizeFor(cap: number, shape: TableShape): { w: number; h: number } {
  if (shape === "round") {
    const s = cap <= 2 ? 9 : cap <= 4 ? 11 : 13;
    return { w: s, h: s };
  }
  if (shape === "square") {
    const s = cap <= 4 ? 12 : 14;
    return { w: s, h: s };
  }
  return { w: Math.round(8 + cap * 1.75), h: 10 };
}

export const SHAPE_LABELS: Record<TableShape, string> = { round: "Redonda", square: "Cuadrada", long: "Larga" };

export const FIXTURE_CLASS: Record<FixtureKind, string> = {
  hatch: "border border-bone/30 bg-[repeating-linear-gradient(45deg,rgba(244,241,236,.07)_0_1px,transparent_1px_8px)]",
  bar: "border border-bone/60 bg-bone/[.06] rounded-xs",
  stool: "border border-bone/45 rounded-full",
  window: "border border-bone/60 bg-well",
  door: "bg-well",
  label: "",
};
