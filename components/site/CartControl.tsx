"use client";

import { Stepper } from "./CartDrawer";
import { useSite } from "./SiteProvider";

/** Botón Agregar → stepper −/＋ (mobile: cuadrado "+", desktop: "+ Agregar"). */
export function CartControl({ id, name }: { id: number; name: string }) {
  const { qtyOf, setQty, ready } = useSite();
  const qty = ready ? qtyOf(id) : 0;
  if (qty > 0) {
    return (
      <Stepper
        qty={qty}
        name={name}
        onDec={() => setQty(id, qty - 1)}
        onInc={() => setQty(id, qty + 1)}
        className="border-sumeria"
        btn="h-[41px] w-10 text-xl d:h-[39px]"
      />
    );
  }
  return (
    <button
      type="button"
      onClick={() => setQty(id, 1)}
      aria-label={`Agregar ${name}`}
      className="flex h-11 w-11 items-center justify-center gap-2 rounded-xs border-[1.5px] border-bone font-display text-[22px] leading-none font-semibold tracking-[.1em] uppercase transition-colors active:bg-bone active:text-ink d:h-[42px] d:w-auto d:px-4 d:text-sm d:hover:bg-bone d:hover:text-ink"
    >
      <span className="d:text-lg">+</span>
      <span className="hidden d:inline">Agregar</span>
    </button>
  );
}
