"use client";

import { useSite } from "./SiteProvider";

/** Cartel de la carta: aparece mientras todavía no se aceptan pedidos (según el horario del panel). */
export function OrdersNotice() {
  const { ordersBlock } = useSite();
  if (!ordersBlock) return null;
  return (
    <div role="status" className="flex items-start gap-3 border border-sumeria bg-alert-bg px-4 py-3 text-sm text-bone">
      <span aria-hidden className="mt-px font-display text-base leading-none text-sumeria">!</span>
      <span>{ordersBlock}</span>
    </div>
  );
}
