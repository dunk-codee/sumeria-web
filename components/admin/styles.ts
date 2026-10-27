import { cva } from "class-variance-authority";
import type { ResStatus } from "@/lib/schema";

/* Clases del panel (sin "use client": se usan desde el servidor y el cliente). */

export const abtn = cva("inline-flex items-center justify-center gap-1.5 rounded font-semibold whitespace-nowrap transition-colors disabled:cursor-not-allowed disabled:opacity-60", {
  variants: {
    variant: {
      primary: "bg-sumeria-dark text-white hover:bg-sumeria-deep hover:text-white",
      outline: "border border-bone/22 text-panel-text hover:border-panel-text hover:text-panel-text",
      light: "bg-panel-text text-panel-bg hover:bg-white hover:text-panel-bg",
      link: "text-panel-muted underline hover:text-panel-text",
      danger: "text-sumeria-light underline hover:text-sumeria-light",
    },
    size: {
      md: "h-10 px-4 text-sm",
      sm: "h-8 px-3 text-[12.5px]",
      xs: "h-[30px] px-2.5 text-[12.5px]",
      none: "",
    },
  },
  defaultVariants: { variant: "outline", size: "md" },
});

export const inputCls =
  "h-10 min-w-0 rounded border border-bone/16 bg-panel-bg px-3 text-sm text-panel-text outline-none placeholder:text-stone-6 focus:border-panel-text";

export type TagKind = ResStatus | "free";
export const STATUS_LABEL: Record<TagKind, string> = {
  pend: "Pendiente",
  conf: "Confirmada",
  canc: "Cancelada",
  occ: "Ocupada sin reserva",
  free: "Libre",
};
export const statusTag = cva("inline-block rounded border px-2 py-[3px] font-mono text-[10px] whitespace-nowrap uppercase", {
  variants: {
    status: {
      pend: "border-dashed border-kraft text-kraft",
      conf: "border-panel-text bg-panel-text text-panel-bg",
      canc: "border-smoke-3 text-stone-5",
      occ: "border-smoke-3 bg-smoke-3 text-sand",
      free: "border-bone/50 text-panel-text",
    },
  },
});

/** Mesas en el plano del panel: borde + relleno + etiqueta. */
export const PANEL_TABLE: Record<"free" | "pend" | "conf" | "occ", string> = {
  free: "border-[1.5px] border-bone/85 text-panel-text",
  pend: "border-[1.5px] border-dashed border-kraft text-kraft bg-[repeating-linear-gradient(45deg,rgba(216,188,147,.22)_0_2px,transparent_2px_7px)]",
  conf: "border-[1.5px] border-panel-text bg-panel-text text-panel-bg",
  occ: "border border-smoke-4 bg-smoke-2 text-stone-2",
};
