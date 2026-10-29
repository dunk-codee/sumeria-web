"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { cx, money, piecesLabel } from "@/lib/format";
import { button } from "../ui";
import { XMark } from "../XMark";
import { useSite } from "./SiteProvider";

const field =
  "rounded-xs border bg-ink px-3 text-[15px] text-bone outline-none placeholder:text-stone-4 focus:border-bone";

/** Curva de hoja que se desliza: arranca rápido y se asienta suave. */
const EASE_SHEET = [0.32, 0.72, 0, 1] as const;

// Desktop (≥ 900 px, breakpoint `d:`): el carrito entra desde la derecha; mobile: sube como hoja desde abajo.
// El carrito solo se abre después de hidratar, así que el valor del servidor no llega a usarse.
const DESKTOP = "(min-width: 900px)";
const subscribeDesktop = (cb: () => void) => {
  const mq = window.matchMedia(DESKTOP);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};
const useIsDesktop = () =>
  useSyncExternalStore(
    subscribeDesktop,
    () => window.matchMedia(DESKTOP).matches,
    () => false,
  );

/**
 * Teclado en pantalla (solo mobile). iOS no achica la página al abrirlo: `inset` es cuánto tapa, para subir el borde de
 * abajo del carrito. `open`: hay un campo con foco y el área visible se achicó (también en Android, que sí achica la página).
 */
function useKeyboard(enabled: boolean) {
  const [kb, setKb] = useState({ inset: 0, open: false });
  useEffect(() => {
    const vv = window.visualViewport;
    if (!enabled || !vv) return;
    let maxH = vv.height;
    let wasOpen = false;
    const update = () => {
      maxH = Math.max(maxH, vv.height);
      const el = document.activeElement;
      const typing = el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement;
      const inset = Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop));
      const open = typing && vv.height < maxH - 120;
      setKb((k) => (k.inset === inset && k.open === open ? k : { inset, open }));
      // Al abrirse el teclado, el campo con foco queda a la vista.
      if (open && !wasOpen) el.scrollIntoView({ block: "center" });
      wasOpen = open;
    };
    update();
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    document.addEventListener("focusin", update);
    document.addEventListener("focusout", update);
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
      document.removeEventListener("focusin", update);
      document.removeEventListener("focusout", update);
    };
  }, [enabled]);
  return enabled ? kb : { inset: 0, open: false };
}

/** Opciones excluyentes en dos mitades (entrega, pago). */
function Segmented<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly (readonly [T, string])[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="grid grid-cols-2 overflow-hidden rounded-xs border border-bone/30">
      {options.map(([v, text]) => (
        <button
          key={v}
          type="button"
          role="radio"
          aria-checked={value === v}
          onClick={() => onChange(v)}
          className={cx(
            "flex h-[46px] items-center justify-center font-display text-[15px] font-semibold tracking-[.1em] uppercase",
            value === v ? "bg-bone text-ink" : "text-stone-2",
          )}
        >
          {text}
        </button>
      ))}
    </div>
  );
}

/** Rótulo de campo; los opcionales lo dicen. */
function FieldLabel({ children, optional }: { children: ReactNode; optional?: boolean }) {
  return (
    <span className="text-[13px] font-semibold text-sand">
      {children}
      {optional && <span className="font-normal text-stone-3"> (opcional)</span>}
    </span>
  );
}

export function CartDrawer() {
  const s = useSite();
  const [tried, setTried] = useState(false);
  const [notesOpen, setNotesOpen] = useState<Record<number, boolean>>({});
  const closeRef = useRef<HTMLButtonElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const addrRef = useRef<HTMLInputElement>(null);
  const desktop = useIsDesktop();
  const kb = useKeyboard(s.cartOpen && !desktop);
  const hidden = desktop ? { x: "100%" } : { y: "100%" };

  useEffect(() => {
    if (!s.cartOpen) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- la validación arranca de cero al abrir
    setTried(false);
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && s.closeCart();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s.cartOpen]);

  const missName = !s.name.trim();
  const missAddr = s.mode === "delivery" && !s.address.trim();
  const sendErr = tried && (missName || missAddr);

  const send = () => {
    // Falta un dato obligatorio: se lleva la vista al primer campo vacío (con su mensaje) y se le da foco.
    const first = missName ? nameRef.current : missAddr ? addrRef.current : null;
    if (first) {
      setTried(true);
      first.focus({ preventScroll: true });
      first.scrollIntoView({ block: "center", behavior: "smooth" });
      return;
    }
    window.open(s.orderUrl, "_blank", "noopener");
  };

  // Al abrir: el fondo se oscurece y el panel se desliza; al cerrar, lo mismo al revés (más rápido).
  return (
    <AnimatePresence>
      {s.cartOpen && (
        <motion.div
          key="cart-backdrop"
          onClick={s.closeCart}
          className="fixed inset-0 z-50 bg-black/65"
          aria-hidden
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.25 } }}
          transition={{ duration: 0.35, ease: "easeOut" }}
        />
      )}
      {s.cartOpen && (
      <motion.aside
        key="cart-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-title"
        style={kb.inset ? { bottom: kb.inset } : undefined}
        className="fixed top-12 right-0 bottom-0 z-[51] flex w-full flex-col overflow-hidden rounded-t-2xl border-l border-bone/12 bg-[#12100E] d:top-0 d:w-[460px] d:rounded-none"
        initial={hidden}
        animate={{ x: 0, y: 0 }}
        exit={{ ...hidden, transition: { duration: 0.3, ease: [0.4, 0, 1, 1] } }}
        transition={{ duration: 0.5, ease: EASE_SHEET }}
      >
        <div className="flex items-center justify-between gap-3 border-b border-bone/12 px-5 py-[18px]">
          <div className="flex items-baseline gap-2.5">
            <h2 id="cart-title" className="m-0 font-display text-[28px] leading-none font-semibold uppercase">
              Tu pedido
            </h2>
            <span className="font-mono text-[11px] text-stone-3">{s.count === 1 ? "1 ítem" : `${s.count} ítems`}</span>
          </div>
          {/* Cruz simple de cierre, sin fondo (no es el motivo X de la marca). */}
          <button
            ref={closeRef}
            type="button"
            onClick={s.closeCart}
            aria-label="Cerrar"
            className="-mr-2.5 flex h-11 w-11 items-center justify-center text-stone-2 transition-colors hover:text-bone"
          >
            <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" aria-hidden>
              <path d="M5 5l14 14M19 5L5 19" />
            </svg>
          </button>
        </div>

        {s.count === 0 ? (
          <EmptyCart />
        ) : (
          <>
            <div className="flex flex-1 flex-col gap-[22px] overflow-y-auto px-5 pt-1 pb-6">
              <div className="flex flex-col">
                {s.lines.map((it) => {
                  const noteOpen = !!notesOpen[it.id] || !!it.note;
                  return (
                    <div key={it.id} className="flex flex-col gap-2 border-b border-bone/10 py-3.5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 flex-col gap-0.5">
                          <span className="font-display text-lg leading-[1.1] font-semibold uppercase">{it.name}</span>
                          <span className="font-mono text-[10.5px] text-stone-3 uppercase">
                            {[piecesLabel(it.pieces), `${money(it.price)} c/u`].filter(Boolean).join(" · ")}
                          </span>
                        </div>
                        <span className="font-display text-lg font-semibold whitespace-nowrap">{money(it.qty * it.price)}</span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <Stepper
                          qty={it.qty}
                          name={it.name}
                          onDec={() => s.setQty(it.id, it.qty - 1)}
                          onInc={() => s.setQty(it.id, it.qty + 1)}
                          className="border-bone/30"
                          btn="h-10 w-11 text-[19px]"
                        />
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setNotesOpen((n) => ({ ...n, [it.id]: !n[it.id] }))}
                            className="py-2.5 text-[13px] text-stone-2 underline"
                          >
                            {noteOpen ? "Nota" : "+ Agregar nota"}
                          </button>
                          <button
                            type="button"
                            onClick={() => s.setQty(it.id, 0)}
                            aria-label={`Quitar ${it.name} del pedido`}
                            title="Quitar"
                            className="-mr-2.5 flex h-11 w-11 items-center justify-center text-stone-3 transition-colors hover:text-sumeria-light"
                          >
                            <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                              <path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-12M9 7V4h6v3" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      {noteOpen && (
                        <input
                          value={it.note}
                          onChange={(e) => s.setNote(it.id, e.target.value)}
                          placeholder="Ej.: sin sésamo, salsa aparte"
                          aria-label={`Nota para ${it.name}`}
                          className={cx(field, "h-[42px] border-bone/20")}
                        />
                      )}
                    </div>
                  );
                })}
              </div>

              <AddMore />

              <label className="flex flex-col gap-1.5">
                <FieldLabel optional>Nota del pedido</FieldLabel>
                <textarea
                  value={s.generalNote}
                  onChange={(e) => s.set({ generalNote: e.target.value })}
                  rows={2}
                  placeholder="Ej.: palitos para 3, salsa de soja extra"
                  className={cx(field, "resize-y border-bone/20 py-2.5")}
                />
              </label>

              <div className="flex flex-col gap-3">
                <span className="font-display text-sm tracking-[.2em] text-stone-3 uppercase">Pago</span>
                <Segmented
                  label="Método de pago"
                  options={[
                    ["cash", "Efectivo"],
                    ["transfer", "Transferencia"],
                  ]}
                  value={s.payment}
                  onChange={(payment) => s.set({ payment })}
                />
              </div>

              <div className="flex flex-col gap-3">
                <span className="font-display text-sm tracking-[.2em] text-stone-3 uppercase">Entrega</span>
                <Segmented
                  label="Entrega"
                  options={[
                    ["take", "Take away"],
                    ["delivery", "Delivery"],
                  ]}
                  value={s.mode}
                  onChange={(mode) => s.set({ mode })}
                />
                <label className="flex flex-col gap-1.5">
                  <FieldLabel>Nombre</FieldLabel>
                  <input
                    ref={nameRef}
                    value={s.name}
                    onChange={(e) => s.set({ name: e.target.value })}
                    placeholder="A nombre de quién"
                    autoComplete="name"
                    aria-invalid={tried && missName}
                    aria-describedby={tried && missName ? "cart-name-err" : undefined}
                    className={cx(field, "h-[46px] scroll-my-24", tried && missName ? "border-sumeria-light" : "border-bone/20")}
                  />
                  {tried && missName && (
                    <span id="cart-name-err" className="text-[13px] text-sumeria-light">
                      Completá tu nombre.
                    </span>
                  )}
                </label>
                {s.mode === "delivery" ? (
                  <>
                    <label className="flex flex-col gap-1.5">
                      <FieldLabel>Dirección</FieldLabel>
                      <input
                        ref={addrRef}
                        value={s.address}
                        onChange={(e) => s.set({ address: e.target.value })}
                        placeholder="Calle, número, piso"
                        autoComplete="street-address"
                        aria-invalid={tried && missAddr}
                        aria-describedby={tried && missAddr ? "cart-addr-err" : undefined}
                        className={cx(field, "h-[46px] scroll-my-24", tried && missAddr ? "border-sumeria-light" : "border-bone/20")}
                      />
                      {tried && missAddr && (
                        <span id="cart-addr-err" className="text-[13px] text-sumeria-light">
                          Completá la dirección de entrega.
                        </span>
                      )}
                    </label>
                    <label className="flex flex-col gap-1.5">
                      <FieldLabel optional>Aclaraciones de la dirección</FieldLabel>
                      <input
                        value={s.addressNote}
                        onChange={(e) => s.set({ addressNote: e.target.value })}
                        placeholder="Ej.: tocar timbre 2B, portón negro"
                        className={cx(field, "h-[46px] border-bone/20")}
                      />
                    </label>
                  </>
                ) : (
                  <span className="text-sm leading-normal text-stone-2">
                    Retirás por {s.pickupAddress}. Te avisamos por WhatsApp cuando esté listo.
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <span className="font-display text-sm tracking-[.2em] text-stone-3 uppercase">Así llega a WhatsApp</span>
                <div className="flex max-w-[94%] flex-col gap-1.5 self-end rounded-[10px_2px_10px_10px] bg-[#1F2A1F] px-3.5 pt-3 pb-2">
                  <span className="text-[13.5px] leading-normal whitespace-pre-wrap text-[#E9F0E6]">{s.message}</span>
                </div>
              </div>
            </div>

            {/* Con el teclado abierto (mobile) el total se oculta, así no tapa el campo que se está completando. */}
            <div className={cx("flex flex-col gap-2.5 border-t border-bone/12 bg-[#12100E] px-5 pt-3.5 pb-[18px]", kb.open && "hidden")}>
              <div className="flex items-baseline justify-between">
                <span className="font-display text-lg tracking-[.1em] uppercase">Total</span>
                <span className="font-display text-[28px] font-semibold text-sumeria">{money(s.subtotal)}</span>
              </div>
              {sendErr && (
                <span className="text-[13px] text-sumeria-light" role="alert">
                  Faltan datos: revisá los campos marcados.
                </span>
              )}
              <button type="button" onClick={send} className={cx(button({ variant: "primary", size: "lg" }), "py-[17px]")}>
                Enviar pedido por WhatsApp
              </button>
              <span className="text-center text-xs text-stone-3">Se abre WhatsApp con el mensaje listo. Te confirmamos el pedido por ahí.</span>
            </div>
          </>
        )}
      </motion.aside>
      )}
    </AnimatePresence>
  );
}

/** Vuelve a la carta para sumar productos (cierra el carrito). Mismo sello punteado que el "Agregar" de la carta. */
function AddMore() {
  const { closeCart } = useSite();
  return (
    <Link
      href="/carta"
      onClick={closeCart}
      className="group flex h-[60px] flex-none items-center justify-center gap-3 rounded-xs border border-dashed border-bone/25 font-display text-sm font-medium tracking-[.14em] text-bone uppercase transition-colors hover:border-bone/50"
    >
      <span className="flex h-7 min-w-7 -rotate-6 items-center justify-center rounded-xs border-[1.5px] border-dashed border-sumeria font-display text-base leading-none font-semibold text-sumeria transition-[rotate,background-color,color,border-color] duration-200 group-hover:rotate-0 group-hover:border-solid group-hover:border-sumeria-dark group-hover:bg-sumeria-dark group-hover:text-white">
        +
      </span>
      Agregar productos
    </Link>
  );
}

function EmptyCart() {
  const { closeCart } = useSite();
  const path = usePathname();
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3.5 bg-[repeating-linear-gradient(135deg,rgba(255,255,255,.018)_0_1px,transparent_1px_10px)] px-6 py-8 text-center">
      <XMark size={44} stroke={3.6} className="text-bone" />
      <h3 className="m-0 font-display text-[28px] leading-none font-semibold uppercase">Todavía no agregaste nada</h3>
      <p className="m-0 max-w-[30ch] text-[15px] leading-normal text-stone-2">Elegí de la carta y armamos el mensaje para mandar por WhatsApp.</p>
      <Link href="/carta" onClick={path === "/carta" ? closeCart : undefined} className={cx(button({ variant: "primary" }), "mt-1.5")}>
        Ver la carta
      </Link>
    </div>
  );
}

export function Stepper({
  qty,
  name,
  onDec,
  onInc,
  className,
  btn,
}: {
  qty: number;
  name: string;
  onDec: () => void;
  onInc: () => void;
  className?: string;
  btn?: string;
}) {
  return (
    <div className={cx("flex items-center rounded-xs border-[1.5px]", className)}>
      <button type="button" onClick={onDec} aria-label={`Restar ${name}`} className={cx("text-center", btn)}>
        −
      </button>
      <span className="min-w-[22px] text-center font-display text-[17px]" aria-live="polite">
        {qty}
      </span>
      <button type="button" onClick={onInc} aria-label={`Sumar ${name}`} className={cx("text-center", btn)}>
        +
      </button>
    </div>
  );
}

/** Botón flotante "Ver pedido" (inicio y carta). */
export function CartFab() {
  const s = useSite();
  const path = usePathname();
  const show = s.count > 0 && !s.cartOpen && !s.menuOpen && (path === "/" || path === "/carta");
  if (!show) return null;
  return (
    <button
      type="button"
      onClick={s.openCart}
      className="fixed right-3 bottom-4 left-3 z-40 flex h-14 items-center justify-between gap-[18px] rounded-xs bg-sumeria-dark px-[18px] text-white shadow-[0_12px_40px_rgba(0,0,0,.55)] hover:bg-sumeria-deep d:right-8 d:left-auto"
    >
      <span className="flex items-center gap-2.5 font-display text-base font-semibold tracking-[.1em] uppercase">
        <span className="flex h-[26px] min-w-[26px] items-center justify-center rounded-full bg-white px-[7px] text-sm tracking-normal text-sumeria-deep">
          {s.count}
        </span>
        Ver pedido
      </span>
      <span className="font-display text-[19px] font-semibold">{money(s.subtotal)}</span>
    </button>
  );
}
