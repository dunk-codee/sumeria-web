import { cva, type VariantProps } from "class-variance-authority";
import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cx } from "@/lib/format";
import { RedX } from "./XMark";

/* ---------- Botones del sitio ---------- */

export const button = cva(
  "inline-flex items-center justify-center gap-2 rounded-xs border-[1.5px] text-center font-display font-semibold uppercase tracking-widest transition-colors disabled:cursor-not-allowed",
  {
    variants: {
      variant: {
        primary: "border-transparent bg-sumeria-dark text-white hover:bg-sumeria-deep hover:text-white",
        outline: "border-bone bg-transparent text-bone hover:bg-bone hover:text-ink",
        onKraft: "border-transparent bg-ink text-bone hover:bg-[#2A211A] hover:text-bone",
        ghost: "border-bone/30 bg-transparent font-normal text-bone hover:border-bone hover:text-bone",
        text: "border-transparent bg-transparent px-1.5! font-normal text-stone-2 hover:text-bone",
        disabled: "border-transparent bg-smoke-1 text-stone-4 hover:text-stone-4",
      },
      size: {
        lg: "px-6 py-3.75 text-base",
        md: "px-5 py-3 text-[15px]",
        sm: "px-4.5 py-2.75 text-sm",
      },
    },
    defaultVariants: { variant: "primary", size: "lg" },
  },
);
export type ButtonVariants = VariantProps<typeof button>;

export function Button({ variant, size, className, ...props }: ComponentProps<"button"> & ButtonVariants) {
  return <button type="button" className={cx(button({ variant, size }), className)} {...props} />;
}

export function ButtonLink({ variant, size, className, ...props }: ComponentProps<typeof Link> & ButtonVariants) {
  return <Link className={cx(button({ variant, size }), className)} {...props} />;
}

export function ExternalButton({ variant, size, className, ...props }: ComponentProps<"a"> & ButtonVariants) {
  return <a target="_blank" rel="noopener noreferrer" className={cx(button({ variant, size }), className)} {...props} />;
}

/* ---------- Títulos ---------- */

/** "× Carta ×": separador de sección con la X de marca. */
export function Eyebrow({ children, className, tone = "default" }: { children: ReactNode; className?: string; tone?: "default" | "kraft" }) {
  return (
    <div
      className={cx(
        "flex items-center gap-3 font-display text-[13px] uppercase tracking-[.32em]",
        tone === "kraft" ? "text-kraft-ink" : "text-stone-3",
        className,
      )}
    >
      <RedX size={9} stroke={4} className={tone === "kraft" ? "text-sumeria-deep!" : undefined} />
      <span>{children}</span>
      <RedX size={9} stroke={4} className={tone === "kraft" ? "text-sumeria-deep!" : undefined} />
    </div>
  );
}

export function PageTitle({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <h1 className={cx("m-0 font-display text-[clamp(52px,8vw,128px)] leading-[.9] font-semibold uppercase", className)}>{children}</h1>
  );
}

export function SectionTitle({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <h2 className={cx("m-0 font-display text-[clamp(40px,5.5vw,80px)] leading-[.95] font-semibold uppercase", className)}>{children}</h2>
  );
}

/* ---------- Etiquetas ---------- */

export const typeTag = cva(
  "inline-block rounded-xs border-[1.5px] px-2.25 py-1 font-display text-xs font-semibold tracking-[.16em] uppercase",
  {
    variants: {
      type: {
        evento: "border-bone bg-transparent text-bone",
        promo: "border-sumeria-dark bg-sumeria-dark text-white",
        sorteo: "border-kraft bg-kraft text-kraft-ink",
        novedad: "border-dashed border-bone/55 bg-ink text-sand",
      },
    },
  },
);

export const TYPE_LABELS = { evento: "Evento", promo: "Promo", sorteo: "Sorteo", novedad: "Novedad" } as const;

export function MetaTag({ children, tone }: { children: ReactNode; tone: "gf" | "off" }) {
  return (
    <span
      className={cx(
        "rounded-xs px-1.5 py-0.5 font-mono text-[9.5px] tracking-[.04em] uppercase d:text-[10px]",
        tone === "gf" ? "border border-kraft text-kraft" : "border border-dashed border-bone/50 text-bone",
      )}
    >
      {children}
    </span>
  );
}

export function SampleNote({ children }: { children: ReactNode }) {
  return <span className="font-mono text-[10px] tracking-wider text-stone-4 uppercase">{children}</span>;
}
