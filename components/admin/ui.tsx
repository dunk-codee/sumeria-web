"use client";

import type { VariantProps } from "class-variance-authority";
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ComponentProps, type ReactNode } from "react";
import { CheckIcon } from "@/components/icons";
import { maskTime, normalizeTime } from "@/lib/contact";
import { cx } from "@/lib/format";
import { abtn, inputCls, PANEL_TABLE, STATUS_LABEL, statusTag, type TagKind } from "./styles";

export { abtn, inputCls, PANEL_TABLE, STATUS_LABEL, statusTag };

/* ---------- Botones ---------- */


export function AButton({ variant, size, className, ...p }: ComponentProps<"button"> & VariantProps<typeof abtn>) {
  return <button type="button" className={cx(abtn({ variant, size: variant === "link" || variant === "danger" ? "none" : size }), className)} {...p} />;
}

/* ---------- Formularios ---------- */


export function Field({
  label,
  hint,
  error,
  children,
  className,
}: {
  label: ReactNode;
  hint?: ReactNode;
  /** Mensaje de validación: aparece debajo del campo, en rojo. */
  error?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={cx("flex flex-col gap-1.5", className)}>
      <span className="text-[13px] font-semibold text-sand">{label}</span>
      {children}
      {error ? (
        <span role="alert" className="text-xs font-semibold text-sumeria-light">
          {error}
        </span>
      ) : (
        hint && <span className="text-xs text-panel-muted">{hint}</span>
      )}
    </label>
  );
}

export function Switch({ on, onChange, label, sub }: { on: boolean; onChange: (v: boolean) => void; label?: string; sub?: string }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} onClick={() => onChange(!on)} className="flex items-center gap-2">
      <span className={cx("relative h-5 w-9 flex-none rounded-full transition-colors", on ? "bg-panel-text" : "bg-smoke-3")}>
        <span className={cx("absolute top-0.5 h-4 w-4 rounded-full transition-[left]", on ? "left-4.5 bg-panel-bg" : "left-0.5 bg-stone-5")} />
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
          className={cx("h-8.5 px-2 text-[13px] font-semibold", value === v ? "bg-panel-text text-panel-bg" : "text-panel-soft hover:text-panel-text")}
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
    <div className="flex flex-wrap items-end justify-between gap-4 border-b border-bone/8 px-5 pt-7 pb-4.5 md:px-8">
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
  return (
    <span className={cx(statusTag({ status }), status === "conf" && "inline-flex items-center gap-1")}>
      {status === "conf" && <CheckIcon size={11} />}
      {label ?? STATUS_LABEL[status]}
    </span>
  );
}

/** Marca de "Llegaron": sólida y con tick, para que se distinga de Confirmada. */
export function ArrivedTag() {
  return (
    <span className="inline-flex items-center gap-1 rounded bg-kraft px-2 py-0.75 font-mono text-[10px] font-semibold whitespace-nowrap text-ink uppercase">
      <CheckIcon size={11} />
      Llegaron
    </span>
  );
}


/* ---------- Toast (2,6 s) ---------- */

const ToastCtx = createContext<(msg: string, tone?: "ok" | "error") => void>(() => {});
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<{ msg: string; tone: "ok" | "error"; k: number } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const flash = useCallback((msg: string, tone: "ok" | "error" = "ok") => {
    clearTimeout(timer.current);
    // Mismo mensaje seguido: no se vuelve a montar (no repite la animación de entrada), solo se extiende el tiempo.
    setToast((cur) => (cur && cur.msg === msg && cur.tone === tone ? cur : { msg, tone, k: Date.now() }));
    timer.current = setTimeout(() => setToast(null), 2600);
  }, []);
  useEffect(() => () => clearTimeout(timer.current), []);
  return (
    <ToastCtx.Provider value={flash}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed bottom-6 left-1/2 z-80 w-max max-w-[calc(100vw-32px)]">
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

/* ---------- Modal de confirmación ---------- */

/** Cuadro para confirmar una acción que no se deshace sola (cancelar una reserva, etc.). Enfoca "Volver" y cierra con Escape. */
export function ConfirmModal({
  open,
  title,
  body,
  confirmLabel,
  busy,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  body: ReactNode;
  confirmLabel: string;
  busy?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const back = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    back.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        onClick={(e) => e.stopPropagation()}
        className="flex w-full max-w-105 flex-col gap-4 rounded-md border border-bone/12 bg-panel-surface p-6 text-panel-text"
      >
        <h2 id="confirm-title" className="m-0 font-display text-2xl leading-tight font-semibold uppercase">
          {title}
        </h2>
        <div className="text-sm leading-relaxed text-panel-soft">{body}</div>
        <div className="flex flex-wrap justify-end gap-2">
          <button ref={back} type="button" onClick={onClose} className={abtn({ variant: "outline" })}>
            Volver
          </button>
          <button type="button" disabled={busy} onClick={onConfirm} className={abtn({ variant: "cancel" })}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- Fecha en formato día/mes/año ---------- */

/** "2026-11-03" → "03/11/2026". */
export const dmy = (iso: string) => iso.split("-").reverse().join("/");

/**
 * Campo de fecha. El `<input type="date">` nativo muestra el formato del navegador (mes/día en EE. UU.), así que se muestra
 * la fecha como día/mes/año y el calendario se abre con un toque. `value` vacío = sin fecha.
 */
export function DateField({
  value,
  onChange,
  label,
  invalid,
  id,
  placeholder = "dd/mm/aaaa",
}: {
  value: string;
  onChange: (iso: string) => void;
  label: string;
  invalid?: boolean;
  id?: string;
  placeholder?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <span className="relative inline-flex w-full">
      <button
        type="button"
        id={id}
        aria-label={`${label}: ${value ? dmy(value) : "sin fecha"}`}
        aria-describedby={invalid ? `${id ?? "date"}-error` : undefined}
        onClick={() => ref.current?.showPicker?.()}
        className={cx(inputCls, "flex w-full items-center justify-between gap-2 px-2.5 text-left", invalid && "border-sumeria")}
      >
        <span className={cx("font-mono", !value && "text-stone-6")}>{value ? dmy(value) : placeholder}</span>
        <span aria-hidden className="text-panel-muted">
          ▾
        </span>
      </button>
      <input ref={ref} type="date" value={value} tabIndex={-1} aria-hidden onChange={(e) => onChange(e.target.value)} className="pointer-events-none absolute inset-0 opacity-0" />
    </span>
  );
}

/* ---------- Hora HH:MM ---------- */

/** Campo de hora: solo números, los ":" se ponen solos ("1930" → "19:30") y al salir completa ("9" → "09:00"). */
export function TimeField({
  value,
  onChange,
  label,
  invalid,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  label: string;
  invalid?: boolean;
  disabled?: boolean;
}) {
  return (
    <input
      value={value}
      disabled={disabled}
      inputMode="numeric"
      autoComplete="off"
      aria-label={label}
      aria-invalid={invalid}
      placeholder="HH:MM"
      maxLength={5}
      onChange={(e) => onChange(maskTime(e.target.value))}
      onBlur={() => value && onChange(normalizeTime(value) ?? value)}
      className={cx(inputCls, "h-9.5 text-center disabled:opacity-40", invalid && "border-sumeria")}
    />
  );
}
