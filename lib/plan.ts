import type { CSSProperties } from "react";
import type { FixtureKind } from "./schema";

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

/**
 * En el local todas las mesas son cuadradas y del mismo tamaño (pedido del cliente).
 * `w`/`h` siguen guardados en la base, pero siempre valen esto.
 * Como el plano es 10:7 y y va de 0 a 70, 12 × 12 unidades se ve cuadrada en pantalla.
 */
export const TABLE_SIZE = 12;
export const TABLE_BOX = { w: TABLE_SIZE, h: TABLE_SIZE } as const;

export const FIXTURE_CLASS: Record<FixtureKind, string> = {
  hatch: "border border-bone/30 bg-[repeating-linear-gradient(45deg,rgba(244,241,236,.07)_0_1px,transparent_1px_8px)]",
  bar: "border border-bone/60 bg-bone/[.06] rounded-xs",
  stool: "border border-bone/45 rounded-full",
  window: "border border-bone/60 bg-well",
  door: "bg-well",
  label: "",
};
