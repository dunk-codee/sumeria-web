"use client";

import type { VariantProps } from "class-variance-authority";
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ComponentProps, type ReactNode } from "react";
import { cx } from "@/lib/format";
import { abtn, inputCls, PANEL_TABLE, STATUS_LABEL, statusTag, type TagKind } from "./styles";

export { abtn, inputCls, PANEL_TABLE, STATUS_LABEL, statusTag };

/* ---------- Botones ---------- */


export function AButton({ variant, size, className, ...p }: ComponentProps<"button"> & VariantProps<typeof abtn>) {
  return <button type="button" className={cx(abtn({ variant, size: variant === "link" || variant === "danger" ? "none" : size }), className)} {...p} />;
}

/* ---------- Formularios ---------- */


export function Field({ label, hint, children, className }: { label: ReactNode; hint?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <label className={cx("flex flex-col gap-1.5", className)}>
      <span className="text-[13px] font-semibold text-sand">{label}</span>
      {children}
      {hint && <span className="text-xs text-panel-muted">{hint}</span>}
    </label>
  );
}

export function Switch({ on, onChange, label, sub }: { on: boolean; onChange: (v: boolean) => void; label?: string; sub?: string }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} onClick={() => onChange(!on)} className="flex items-center gap-2">
      <span className={cx("relative h-5 w-9 flex-none rounded-full transition-colors", on ? "bg-panel-text" : "bg-smoke-3")}>
        <span className={cx("absolute top-0.5 h-4 w-4 rounded-full transition-[left]", on ? "left-[18px] bg-panel-bg" : "left-0.5 bg-stone-5")} />
      </span>
      {sub && <span className="text-[12.5px] text-sand">{sub}</span>}
    </button>
  );
}

export function Segmented<T extends string | number>({
  value,
  options,
  onChange,
  className,
}: {
  value: T;
  options: readonly (readonly [T, string])[];
  onChange: (v: T) => void;
  className?: string;
}) {
  return (
    <div className={cx("grid overflow-hidden rounded border border-bone/20", className)} style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0,1fr))` }} role="radiogroup">
      {options.map(([v, label]) => (
        <button
          key={String(v)}
          type="button"
          role="radio"
          aria-checked={value === v}
          onClick={() => onChange(v)}
          className={cx("h-[34px] px-2 text-[13px] font-semibold", value === v ? "bg-panel-text text-panel-bg" : "text-panel-soft hover:text-panel-text")}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

/* ---------- Encabezado y tarjetas ---------- */

export function PageHead({ kicker, title, children }: { kicker: ReactNode; title: ReactNode; children?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 border-b border-bone/8 px-5 pt-7 pb-[18px] md:px-8">
      <div className="flex flex-col gap-1">
        <span className="font-mono text-[11px] tracking-[.08em] text-panel-muted uppercase">{kicker}</span>
        <h1 className="m-0 font-display text-[34px] leading-[1.05] font-semibold uppercase">{title}</h1>
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <section className={cx("rounded-md border border-bone/8 bg-panel-surface", className)}>{children}</section>;
}

/* ---------- Estados de reserva ---------- */

export function StatusTag({ status, label }: { status: TagKind; label?: string }) {
  return <span className={statusTag({ status })}>{label ?? STATUS_LABEL[status]}</span>;
}


/* ---------- Toast (2,6 s) ---------- */

const ToastCtx = createContext<(msg: string, tone?: "ok" | "error") => void>(() => {});
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<{ msg: string; tone: "ok" | "error"; k: number } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const flash = useCallback((msg: string, tone: "ok" | "error" = "ok") => {
    clearTimeout(timer.current);
    setToast({ msg, tone, k: Date.now() });
    timer.current = setTimeout(() => setToast(null), 2600);
  }, []);
  useEffect(() => () => clearTimeout(timer.current), []);
  return (
    <ToastCtx.Provider value={flash}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed bottom-6 left-1/2 z-[80] w-max max-w-[calc(100vw-32px)]">
        {toast && (
          <div
            key={toast.k}
            className={cx(
              "-translate-x-1/2 animate-toast-in rounded px-4 py-3 text-sm font-semibold shadow-[0_10px_30px_rgba(0,0,0,.4)]",
              toast.tone === "ok" ? "bg-panel-text text-panel-bg" : "bg-sumeria-dark text-white",
            )}
          >
            {toast.msg}
          </div>
        )}
      </div>
    </ToastCtx.Provider>
  );
}

/** Ejecuta una Server Action mostrando el toast de éxito o el error. */
export function useRun() {
  const flash = useToast();
  return useCallback(
    async <R extends { ok: boolean; error?: string }>(p: Promise<R>, okMsg?: string): Promise<R | null> => {
      try {
        const r = await p;
        if (!r.ok) flash(r.error ?? "No se pudo guardar.", "error");
        else if (okMsg) flash(okMsg);
        return r;
      } catch {
        flash("Algo salió mal. Probá de nuevo.", "error");
        return null;
      }
    },
    [flash],
  );
}
