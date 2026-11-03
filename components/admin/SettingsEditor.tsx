"use client";

import { useState, useTransition } from "react";
import { saveSettings, type SettingsInput } from "@/app/admin/actions";
import { cx } from "@/lib/format";
import { DAY_NAMES, WEEK_ORDER } from "@/lib/hours";
import type { DayHours } from "@/lib/schema";
import { AButton, Card, Field, inputCls, Switch, useRun } from "./ui";

export function SettingsEditor({
  initial,
}: {
  initial: { address: string; city: string; whatsapp: string; instagram: string; hours: DayHours[] };
}) {
  const run = useRun();
  const [saving, start] = useTransition();
  const [s, setS] = useState({
    address: initial.address,
    city: initial.city,
    whatsapp: "+" + initial.whatsapp,
    instagram: "@" + initial.instagram,
  });
  const [hours, setHours] = useState<DayHours[]>(initial.hours);

  const save = () =>
    start(async () => {
      const input: SettingsInput = { ...s, hours };
      await run(saveSettings(input), "Datos guardados. Ya se ven en el sitio.");
    });

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-bone/8 px-5 pt-7 pb-4.5 md:px-8">
        <div className="flex flex-col gap-1">
          <span className="font-mono text-[11px] tracking-[.08em] text-panel-muted uppercase">Configuración</span>
          <h1 className="m-0 font-display text-[34px] leading-[1.05] font-semibold uppercase">Datos del local</h1>
        </div>
        <AButton variant="primary" onClick={save} disabled={saving}>
          {saving ? "Guardando…" : "Guardar"}
        </AButton>
      </div>
      <div className="grid max-w-275 grid-cols-[repeat(auto-fit,minmax(min(100%,360px),1fr))] items-start gap-4 px-5 pt-5 pb-12 md:px-8">
        <Card className="flex flex-col gap-3 p-4.5">
          <h2 className="m-0 text-[15px] font-bold">Contacto y ubicación</h2>
          <Field label="Dirección">
            <input value={s.address} onChange={(e) => setS({ ...s, address: e.target.value })} className={inputCls} />
          </Field>
          <Field label="Ciudad">
            <input value={s.city} onChange={(e) => setS({ ...s, city: e.target.value })} className={inputCls} />
          </Field>
          <Field label="WhatsApp para pedidos y reservas" hint="Con código de país y área: +54 9 3442 535419">
            <input value={s.whatsapp} onChange={(e) => setS({ ...s, whatsapp: e.target.value })} inputMode="tel" className={inputCls} />
          </Field>
          <Field label="Instagram">
            <input value={s.instagram} onChange={(e) => setS({ ...s, instagram: e.target.value })} className={inputCls} />
          </Field>
        </Card>
        <Card className="flex flex-col gap-3 p-4.5 md:col-span-2">
          <h2 className="m-0 text-[15px] font-bold">Horarios por día</h2>
          <div className="hidden grid-cols-[110px_72px_1fr_1fr_1fr] gap-2 font-mono text-[10.5px] text-panel-muted uppercase sm:grid">
            <span />
            <span>Abierto</span>
            <span className="text-center">Abre</span>
            <span className="text-center">Cierra</span>
            <span className="text-center">Pedidos desde</span>
          </div>
          {WEEK_ORDER.map((d) => {
            const h = hours.find((x) => x.day === d)!;
            const upd = (p: Partial<DayHours>) => setHours((hs) => hs.map((x) => (x.day === d ? { ...x, ...p } : x)));
            const time = (k: "from" | "to" | "ordersFrom", label: string) => (
              <input
                value={h[k]}
                disabled={h.closed}
                aria-label={`${DAY_NAMES[d]}: ${label}`}
                onChange={(e) => upd({ [k]: e.target.value })}
                placeholder="HH:MM"
                className={cx(inputCls, "h-9.5 text-center disabled:opacity-40")}
              />
            );
            return (
              <div key={d} className="grid grid-cols-[1fr_1fr_1fr] items-center gap-2 border-b border-bone/6 pb-3 sm:grid-cols-[110px_72px_1fr_1fr_1fr] sm:border-0 sm:pb-0">
                <span className="col-span-2 text-sm font-semibold sm:col-span-1">{DAY_NAMES[d]}</span>
                <span className="justify-self-end sm:justify-self-start">
                  <Switch on={!h.closed} onChange={(on) => upd({ closed: !on })} label={`${DAY_NAMES[d]}: abierto`} />
                </span>
                {time("from", "abre")}
                {time("to", "cierra")}
                {time("ordersFrom", "pedidos desde")}
              </div>
            );
          })}
          <span className="text-[12.5px] text-panel-muted">
            Se muestran en Nosotros, y el inicio y el pie usan la hora de apertura. “Pedidos desde” es la hora a partir de la cual el carrito deja enviar el pedido por
            WhatsApp; los días cerrados no reciben pedidos. El turno de reservas es fijo y los días reservables se definen en Calendario de reservas.
          </span>
        </Card>
      </div>
    </>
  );
}
