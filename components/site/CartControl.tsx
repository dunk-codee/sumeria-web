"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { cx } from "@/lib/format";
import { useSite } from "./SiteProvider";

/** Sello hanko, igual que el del botón del pedido en el header. */
const SEAL = "flex h-7.5 min-w-7.5 items-center justify-center rounded-xs px-1 font-display text-lg leading-none font-semibold d:h-7 d:min-w-7 d:text-base";
const STAMP = { type: "spring", stiffness: 700, damping: 22, mass: 0.6 } as const;
const SIDE = "flex h-11 w-10 items-center justify-center font-display text-[22px] leading-none text-stone-2 transition-colors hover:text-bone active:text-sumeria";

/**
 * Agregar a la carta como un sello hanko. Sin ítems: "Agregar" + sello punteado con "+" (en mobile, solo el sello).
 * Al agregar, el sello se estampa (cae grande y girado, como el del header) con una onda de tinta, y queda −/+ a los
 * costados con la cantidad dentro del sello. Cada cambio vuelve a estampar.
 */
export function CartControl({ id, name }: { id: number; name: string }) {
  const { qtyOf, setQty, ready } = useSite();
  const reduce = useReducedMotion();
  const qty = ready ? qtyOf(id) : 0;
  // Cuenta los "sumar": cada uno dispara una onda de tinta nueva.
  const [ink, setInk] = useState(0);
  const addRef = useRef<HTMLButtonElement>(null);
  const incRef = useRef<HTMLButtonElement>(null);
  // Al pasar de "Agregar" al stepper (o al revés) el botón tocado desaparece: el foco pasa al equivalente.
  const refocus = useRef<"inc" | "add" | null>(null);

  useEffect(() => {
    if (refocus.current === "inc") incRef.current?.focus();
    if (refocus.current === "add") addRef.current?.focus();
    refocus.current = null;
  }, [qty]);

  const add = () => {
    if (qty === 0) refocus.current = "inc";
    setInk((n) => n + 1);
    setQty(id, qty + 1);
  };
  const remove = () => {
    if (qty === 1) refocus.current = "add";
    setQty(id, qty - 1);
  };

  if (qty === 0) {
    return (
      <button
        ref={addRef}
        type="button"
        onClick={add}
        aria-label={`Agregar ${name}`}
        className="group flex h-11 min-w-11 items-center justify-center gap-2.5 font-display text-sm font-medium tracking-[.14em] text-bone uppercase d:justify-end d:pl-2"
      >
        <span className="hidden d:inline">Agregar</span>
        <span
          className={cx(
            SEAL,
            "border-[1.5px] border-dashed border-sumeria text-sumeria transition-[background-color,color,border-color] duration-200",
            "group-hover:border-solid group-hover:border-sumeria-dark group-hover:bg-sumeria-dark group-hover:text-white",
            "group-active:border-solid group-active:border-sumeria-dark group-active:bg-sumeria-dark group-active:text-white",
          )}
        >
          +
        </span>
      </button>
    );
  }

  return (
    <div className="flex items-center">
      <button type="button" onClick={remove} aria-label={`Restar ${name}`} className={SIDE}>
        −
      </button>
      {/* Contenedor fijo: el sello y la onda se animan por encima sin mover los botones. */}
      <span className="relative flex h-7.5 min-w-7.5 items-center justify-center d:h-7 d:min-w-7" aria-live="polite">
        <AnimatePresence>
          {ink > 0 && !reduce && (
            <motion.span
              key={ink}
              aria-hidden
              className="pointer-events-none absolute inset-0 rounded-xs border-2 border-sumeria"
              initial={{ scale: 1, opacity: 0.7, rotate: 0 }}
              animate={{ scale: 2.4, opacity: 0, rotate: 8 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.55, ease: [0.2, 0, 0, 1] }}
            />
          )}
        </AnimatePresence>
        {/* Si la cantidad vino del pedido guardado (sin tocar nada) el sello aparece quieto. */}
        <AnimatePresence initial={ink > 0} mode="popLayout">
          <motion.span
            key={qty}
            className={cx(SEAL, "bg-sumeria-dark text-white ring-1 ring-white/35 ring-inset")}
            initial={reduce ? false : { scale: 1.8, rotate: -16, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.1 } }}
            transition={STAMP}
          >
            <span className="sr-only">{name}: </span>
            {qty}
          </motion.span>
        </AnimatePresence>
      </span>
      <button ref={incRef} type="button" onClick={add} aria-label={`Sumar ${name}`} className={SIDE}>
        +
      </button>
    </div>
  );
}
