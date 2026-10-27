"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { cx, money, piecesLabel } from "@/lib/format";
import { button } from "../ui";
import { XMark } from "../XMark";
import { useSite } from "./SiteProvider";

const field =
  "rounded-xs border bg-ink px-3 text-[15px] text-bone outline-none placeholder:text-stone-4 focus:border-bone";

export function CartDrawer() {
  const s = useSite();
  const [tried, setTried] = useState(false);
  const [notesOpen, setNotesOpen] = useState<Record<number, boolean>>({});
  const closeRef = useRef<HTMLButtonElement>(null);

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

  if (!s.cartOpen) return null;

  const missName = !s.name.trim();
  const missAddr = s.mode === "delivery" && !s.address.trim();
  const sendErr = tried && (missName || missAddr);
  const errText =
    missName && missAddr ? "Completá tu nombre y la dirección de entrega." : missName ? "Completá tu nombre." : "Completá la dirección de entrega.";

  const send = () => {
    if (missName || missAddr) {
      setTried(true);
      return;
    }
    window.open(s.orderUrl, "_blank", "noopener");
  };

  return (
    <>
      <div onClick={s.closeCart} className="fixed inset-0 z-50 bg-black/65" aria-hidden />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-title"
        className="fixed top-12 right-0 bottom-0 z-[51] flex w-full flex-col overflow-hidden rounded-t-2xl border-l border-bone/12 bg-[#12100E] d:top-0 d:w-[460px] d:rounded-none"
      >
        <div className="flex items-center justify-between gap-3 border-b border-bone/12 px-5 py-[18px]">
          <div className="flex items-baseline gap-2.5">
            <h2 id="cart-title" className="m-0 font-display text-[28px] leading-none font-semibold uppercase">
              Tu pedido
            </h2>
            <span className="font-mono text-[11px] text-stone-3">{s.count === 1 ? "1 ítem" : `${s.count} ítems`}</span>
          </div>
          <button ref={closeRef} type="button" onClick={s.closeCart} aria-label="Cerrar" className="flex h-11 w-11 items-center justify-center">
            <XMark size={16} stroke={3.2} className="text-bone" />
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
                        <button
                          type="button"
                          onClick={() => setNotesOpen((n) => ({ ...n, [it.id]: !n[it.id] }))}
                          className="py-2.5 text-[13px] text-stone-2 underline"
                        >
                          {noteOpen ? "Nota" : "+ Agregar nota"}
                        </button>
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

              <label className="flex flex-col gap-1.5">
                <span className="text-[13px] font-semibold text-sand">Nota para el pedido</span>
                <textarea
                  value={s.generalNote}
                  onChange={(e) => s.set({ generalNote: e.target.value })}
                  rows={2}
                  placeholder="Ej.: tocar timbre 2B, palitos para 3"
                  className={cx(field, "resize-y border-bone/20 py-2.5")}
                />
              </label>

              <div className="flex flex-col gap-3">
                <span className="font-display text-sm tracking-[.2em] text-stone-3 uppercase">Entrega</span>
                <div className="grid grid-cols-2 overflow-hidden rounded-xs border border-bone/30" role="radiogroup" aria-label="Entrega">
                  {(
                    [
                      ["delivery", "Delivery"],
                      ["take", "Take away"],
                    ] as const
                  ).map(([m, label]) => (
                    <button
                      key={m}
                      type="button"
                      role="radio"
                      aria-checked={s.mode === m}
                      onClick={() => s.set({ mode: m })}
                      className={cx(
                        "flex h-[46px] items-center justify-center font-display text-[15px] font-semibold tracking-[.1em] uppercase",
                        s.mode === m ? "bg-bone text-ink" : "text-stone-2",
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <label className="flex flex-col gap-1.5">
                  <span className="text-[13px] font-semibold text-sand">Nombre</span>
                  <input
                    value={s.name}
                    onChange={(e) => s.set({ name: e.target.value })}
                    placeholder="A nombre de quién"
                    autoComplete="name"
                    aria-invalid={tried && missName}
                    className={cx(field, "h-[46px]", tried && missName ? "border-sumeria-light" : "border-bone/20")}
                  />
                </label>
                {s.mode === "delivery" ? (
                  <>
                    <label className="flex flex-col gap-1.5">
                      <span className="text-[13px] font-semibold text-sand">Dirección</span>
                      <input
                        value={s.address}
                        onChange={(e) => s.set({ address: e.target.value })}
                        placeholder="Calle, número, piso"
                        autoComplete="street-address"
                        aria-invalid={tried && missAddr}
                        className={cx(field, "h-[46px]", tried && missAddr ? "border-sumeria-light" : "border-bone/20")}
                      />
                    </label>
                    {s.zones.length > 0 && (
                      <div className="flex flex-col gap-1.5" role="radiogroup" aria-label="Zona de envío">
                        <span className="text-[13px] font-semibold text-sand">Zona</span>
                        {s.zones.map((z) => {
                          const active = s.zoneObj?.id === z.id;
                          return (
                            <button
                              key={z.id}
                              type="button"
                              role="radio"
                              aria-checked={active}
                              onClick={() => s.set({ zone: z.id })}
                              className={cx(
                                "flex items-center justify-between gap-2.5 rounded-xs border px-3 py-[11px] text-left",
                                active ? "border-bone" : "border-bone/18",
                              )}
                            >
                              <span className="flex items-center gap-2.5">
                                <span className="flex w-3.5">{active && <XMark size={11} stroke={4} className="text-sumeria" />}</span>
                                <span className="flex flex-col">
                                  <span className="text-sm font-semibold">{z.name}</span>
                                  <span className="text-xs text-stone-3">{z.description}</span>
                                </span>
                              </span>
                              <span className="font-display text-base">{money(z.price)}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
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

            <div className="flex flex-col gap-2.5 border-t border-bone/12 bg-[#12100E] px-5 pt-3.5 pb-[18px]">
              <div className="flex flex-col gap-[3px] text-sm text-stone-2">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{money(s.subtotal)}</span>
                </div>
                {s.mode === "delivery" && (
                  <div className="flex justify-between">
                    <span>Envío</span>
                    <span>{money(s.envio)}</span>
                  </div>
                )}
              </div>
              <div className="flex items-baseline justify-between">
                <span className="font-display text-lg tracking-[.1em] uppercase">Total</span>
                <span className="font-display text-[28px] font-semibold text-sumeria">{money(s.total)}</span>
              </div>
              {sendErr && (
                <span className="text-[13px] text-sumeria-light" role="alert">
                  {errText}
                </span>
              )}
              <button type="button" onClick={send} className={cx(button({ variant: "primary", size: "lg" }), "py-[17px]")}>
                Enviar pedido por WhatsApp
              </button>
              <span className="text-center text-xs text-stone-3">Se abre WhatsApp con el mensaje listo. Te confirmamos el pedido por ahí.</span>
            </div>
          </>
        )}
      </aside>
    </>
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
      <span className="font-display text-[19px] font-semibold">{money(s.total)}</span>
    </button>
  );
}
