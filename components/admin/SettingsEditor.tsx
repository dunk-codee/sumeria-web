"use client";

import { useState, useTransition } from "react";
import { saveSettings, type SettingsInput } from "@/app/admin/actions";
import { cx } from "@/lib/format";
import type { HoursRow } from "@/lib/schema";
import { AButton, Card, Field, inputCls, useRun } from "./ui";

type Zone = { name: string; description: string; price: string };

export function SettingsEditor({
  initial,
}: {
  initial: { address: string; city: string; whatsapp: string; instagram: string; hours: HoursRow[]; zones: { name: string; description: string; price: number }[] };
}) {
  const run = useRun();
  const [saving, start] = useTransition();
  const [s, setS] = useState({
    address: initial.address,
    city: initial.city,
    whatsapp: "+" + initial.whatsapp,
    instagram: "@" + initial.instagram,
  });
  const [hours, setHours] = useState<HoursRow[]>(initial.hours);
  const [zones, setZones] = useState<Zone[]>(initial.zones.map((z) => ({ ...z, price: String(z.price) })));

  const save = () =>
    start(async () => {
      const input: SettingsInput = { ...s, hours, zones: zones.map((z) => ({ ...z, price: Number(z.price) || 0 })) };
      await run(saveSettings(input), "Datos guardados. Ya se ven en el sitio.");
    });

  const updZone = (i: number, p: Partial<Zone>) => setZones((zs) => zs.map((z, j) => (j === i ? { ...z, ...p } : z)));

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
        <Card className="flex flex-col gap-3 p-4.5">
          <h2 className="m-0 text-[15px] font-bold">Horarios</h2>
          <div className="grid grid-cols-[1fr_88px_88px] gap-2 font-mono text-[10.5px] text-panel-muted uppercase">
            <span />
            <span className="text-center">Desde</span>
            <span className="text-center">Hasta</span>
          </div>
          {hours.map((h, i) => (
            <div key={h.key} className="grid grid-cols-[1fr_88px_88px] items-center gap-2">
              <span className="text-sm">{h.label}</span>
              {(["from", "to"] as const).map((k) => (
                <input
                  key={k}
                  value={h[k]}
                  aria-label={`${h.label} ${k === "from" ? "desde" : "hasta"}`}
                  onChange={(e) => setHours((hs) => hs.map((x, j) => (j === i ? { ...x, [k]: e.target.value } : x)))}
                  placeholder="HH:MM"
                  className={cx(inputCls, "h-9.5 text-center")}
                />
              ))}
            </div>
          ))}
          <span className="text-[12.5px] text-panel-muted">
            Abierto todos los días. El sitio muestra estos horarios; el turno de reservas es único y los días reservables se definen en Calendario de reservas.
          </span>
        </Card>
        <Card className="col-span-full flex flex-col gap-3 p-4.5">
          <div className="flex items-center justify-between">
            <h2 className="m-0 text-[15px] font-bold">Zonas de delivery</h2>
            <AButton variant="link" className="text-[13px]" onClick={() => setZones((zs) => [...zs, { name: `Zona ${zs.length + 1}`, description: "", price: "" }])}>
              + Agregar zona
            </AButton>
          </div>
          <div className="hidden grid-cols-[1fr_1.4fr_120px_60px] gap-2 font-mono text-[10.5px] text-panel-muted uppercase sm:grid">
            <span>Nombre</span>
            <span>Alcance</span>
            <span>Precio</span>
            <span />
          </div>
          {zones.map((z, i) => (
            <div key={i} className="grid grid-cols-1 items-center gap-2 border-b border-bone/6 pb-3 sm:grid-cols-[1fr_1.4fr_120px_60px] sm:border-0 sm:pb-0">
              <input value={z.name} onChange={(e) => updZone(i, { name: e.target.value })} aria-label="Nombre de la zona" className={cx(inputCls, "h-9.5")} />
              <input value={z.description} onChange={(e) => updZone(i, { description: e.target.value })} aria-label="Alcance" className={cx(inputCls, "h-9.5")} />
              <input
                value={z.price}
                onChange={(e) => updZone(i, { price: e.target.value.replace(/\D/g, "") })}
                inputMode="numeric"
                aria-label="Precio de envío"
                placeholder="$"
                className={cx(inputCls, "h-9.5")}
              />
              <AButton variant="link" className="justify-self-start text-[13px]" onClick={() => setZones((zs) => zs.filter((_, j) => j !== i))}>
                Quitar
              </AButton>
            </div>
          ))}
          {zones.length === 0 && <span className="text-[13px] text-panel-muted">Sin zonas: el carrito no cobra envío.</span>}
        </Card>
      </div>
    </>
  );
}
