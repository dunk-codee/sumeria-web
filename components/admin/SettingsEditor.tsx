"use client";

import { useState, useTransition } from "react";
import { saveSettings, type SettingsInput } from "@/app/admin/actions";
import { arPhoneFromLocal, formatArLocal, formatArPhone, instagramHandle, isArPhone, isInstagramHandle, normalizeTime } from "@/lib/contact";
import { cx } from "@/lib/format";
import { DAY_NAMES, WEEK_ORDER } from "@/lib/hours";
import type { DayHours } from "@/lib/schema";
import { AButton, Card, Field, inputCls, Switch, TimeField, useRun } from "./ui";

type Errors = { address?: string; city?: string; whatsapp?: string; instagram?: string; hours?: Record<number, string> };
type TimeKey = "from" | "to" | "ordersFrom";
const TIME_LABEL: Record<TimeKey, string> = { from: "la hora de apertura", to: "la hora de cierre", ordersFrom: "la hora desde la que se toman pedidos" };

export function SettingsEditor({
  initial,
}: {
  initial: { address: string; city: string; whatsapp: string; instagram: string; hours: DayHours[] };
}) {
  const run = useRun();
  const [saving, start] = useTransition();
  // El WhatsApp se guarda como dígitos ("5493442535419") y se muestra con formato.
  const [s, setS] = useState({ address: initial.address, city: initial.city, whatsapp: initial.whatsapp, instagram: "@" + initial.instagram });
  const [hours, setHours] = useState<DayHours[]>(initial.hours);
  const [baseline, setBaseline] = useState(JSON.stringify({ s, hours }));
  const [errors, setErrors] = useState<Errors>({});
  const dirty = JSON.stringify({ s, hours }) !== baseline;

  const set = (p: Partial<typeof s>) => setS((cur) => ({ ...cur, ...p }));
  const clear = (k: "address" | "city" | "whatsapp" | "instagram") => setErrors((e) => (e[k] ? { ...e, [k]: undefined } : e));
  const bad = (k: "address" | "city" | "whatsapp" | "instagram") => (errors[k] ? "border-sumeria" : "");

  // El "+54 9" ya está escrito: solo se tipea el código de área y el número (si pegan el número completo, también se arregla).
  const onPhone = (value: string) => {
    set({ whatsapp: arPhoneFromLocal(value) });
    clear("whatsapp");
  };

  const save = () => {
    const next: Errors = {};
    if (s.address.trim().length < 3) next.address = "Escribí la dirección.";
    if (s.city.trim().length < 2) next.city = "Escribí la ciudad.";
    if (!isArPhone(s.whatsapp)) next.whatsapp = "Ingresá el celular completo: código de área y número (ej.: 3442 53-5419).";
    const ig = instagramHandle(s.instagram);
    if (!isInstagramHandle(ig)) next.instagram = "Usuario inválido: solo letras, números, puntos y guiones bajos.";
    const hoursErr: Record<number, string> = {};
    for (const h of hours) {
      if (h.closed) continue;
      const badKey = (["from", "to", "ordersFrom"] as const).find((k) => normalizeTime(h[k]) !== h[k]);
      if (badKey) hoursErr[h.day] = `Revisá ${TIME_LABEL[badKey]}: usá el formato HH:MM (ej.: 19:30).`;
    }
    if (Object.keys(hoursErr).length) next.hours = hoursErr;
    setErrors(next);
    if (Object.keys(next).length) {
      const id = next.address ? "settings-address" : next.city ? "settings-city" : next.whatsapp ? "settings-whatsapp" : next.instagram ? "settings-instagram" : null;
      document.getElementById(id ?? "settings-hours")?.scrollIntoView({ block: "center", behavior: "smooth" });
      if (id) document.getElementById(id)?.focus({ preventScroll: true });
      return;
    }
    start(async () => {
      const input: SettingsInput = { ...s, instagram: ig, hours };
      const r = await run(saveSettings(input), "Datos guardados. Ya se ven en el sitio.");
      if (r?.ok) {
        const saved = { ...s, instagram: "@" + ig };
        setS(saved);
        setBaseline(JSON.stringify({ s: saved, hours }));
      }
    });
  };

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-bone/8 px-5 pt-7 pb-4.5 md:px-8">
        <div className="flex flex-col gap-1">
          <span className="font-mono text-[11px] tracking-[.08em] text-panel-muted uppercase">Configuración</span>
          <h1 className="m-0 font-display text-[34px] leading-[1.05] font-semibold uppercase">Datos del local</h1>
        </div>
        <div className="flex items-center gap-3">
          {dirty && <span className="font-mono text-[11px] text-kraft uppercase">Cambios sin guardar</span>}
          <AButton variant="primary" onClick={save} disabled={saving}>
            {saving ? "Guardando…" : "Guardar"}
          </AButton>
        </div>
      </div>
      <div className="grid max-w-275 grid-cols-[repeat(auto-fit,minmax(min(100%,360px),1fr))] items-start gap-4 px-5 pt-5 pb-12 md:px-8">
        <Card className="flex flex-col gap-3 p-4.5 md:col-span-2">
          <h2 className="m-0 text-[15px] font-bold">Contacto y ubicación</h2>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <Field label="Dirección" error={errors.address}>
              <input
                id="settings-address"
                value={s.address}
                onChange={(e) => (set({ address: e.target.value }), clear("address"))}
                aria-invalid={!!errors.address}
                className={cx(inputCls, bad("address"))}
              />
            </Field>
            <Field label="Ciudad" error={errors.city}>
              <input
                id="settings-city"
                value={s.city}
                onChange={(e) => (set({ city: e.target.value }), clear("city"))}
                aria-invalid={!!errors.city}
                className={cx(inputCls, bad("city"))}
              />
            </Field>
            <Field
              label="WhatsApp para pedidos y reservas"
              error={errors.whatsapp}
              hint={isArPhone(s.whatsapp) ? `Los pedidos y reservas llegan a ${formatArPhone(s.whatsapp)}.` : "Escribí solo el código de área y el número."}
            >
              <span
                className={cx(
                  "flex h-10 items-center overflow-hidden rounded border bg-panel-bg text-sm text-panel-text focus-within:border-panel-text",
                  errors.whatsapp ? "border-sumeria" : "border-bone/16",
                )}
              >
                <span className="flex h-full items-center border-r border-bone/16 bg-bone/6 px-3 font-mono text-panel-soft select-none">+54 9</span>
                <input
                  id="settings-whatsapp"
                  value={formatArLocal(s.whatsapp)}
                  onChange={(e) => onPhone(e.target.value)}
                  inputMode="tel"
                  autoComplete="off"
                  placeholder="3442 53-5419"
                  aria-label="WhatsApp: código de área y número (el +54 9 ya está puesto)"
                  aria-invalid={!!errors.whatsapp}
                  className="h-full min-w-0 flex-1 bg-transparent px-3 font-mono outline-none placeholder:text-stone-6"
                />
              </span>
            </Field>
            <Field label="Instagram" error={errors.instagram} hint="Podés pegar el usuario o el link del perfil.">
              <input
                id="settings-instagram"
                value={s.instagram}
                onChange={(e) => (set({ instagram: e.target.value }), clear("instagram"))}
                aria-invalid={!!errors.instagram}
                className={cx(inputCls, bad("instagram"))}
              />
            </Field>
          </div>
        </Card>
        <Card className="flex flex-col gap-3 p-4.5 md:col-span-2">
          <h2 id="settings-hours" className="m-0 text-[15px] font-bold">
            Horarios por día
          </h2>
          <div className="hidden grid-cols-[110px_72px_1fr_1fr_1fr] gap-2 font-mono text-[10.5px] text-panel-muted uppercase sm:grid">
            <span />
            <span>Abierto</span>
            <span className="text-center">Abre</span>
            <span className="text-center">Cierra</span>
            <span className="text-center">Pedidos desde</span>
          </div>
          {WEEK_ORDER.map((d) => {
            const h = hours.find((x) => x.day === d)!;
            const upd = (p: Partial<DayHours>) => {
              setHours((hs) => hs.map((x) => (x.day === d ? { ...x, ...p } : x)));
              if (errors.hours?.[d]) setErrors((e) => ({ ...e, hours: { ...e.hours, [d]: "" } }));
            };
            const err = errors.hours?.[d];
            const time = (k: TimeKey, label: string) => (
              <TimeField value={h[k]} disabled={h.closed} label={`${DAY_NAMES[d]}: ${label}`} invalid={!!err && normalizeTime(h[k]) !== h[k]} onChange={(v) => upd({ [k]: v })} />
            );
            // Aviso suave (no bloquea): se toman pedidos antes de abrir el local.
            const early = !h.closed && normalizeTime(h.ordersFrom) === h.ordersFrom && normalizeTime(h.from) === h.from && h.ordersFrom < h.from;
            return (
              <div key={d} className="flex flex-col gap-1.5 border-b border-bone/6 pb-3 sm:border-0 sm:pb-0">
                <div className="grid grid-cols-[1fr_1fr_1fr] items-center gap-2 sm:grid-cols-[110px_72px_1fr_1fr_1fr]">
                  <span className="col-span-2 text-sm font-semibold sm:col-span-1">{DAY_NAMES[d]}</span>
                  <span className="justify-self-end sm:justify-self-start">
                    <Switch on={!h.closed} onChange={(on) => upd({ closed: !on })} label={`${DAY_NAMES[d]}: abierto`} />
                  </span>
                  {time("from", "abre")}
                  {time("to", "cierra")}
                  {time("ordersFrom", "pedidos desde")}
                </div>
                {err && (
                  <span role="alert" className="text-xs font-semibold text-sumeria-light">
                    {DAY_NAMES[d]}: {err}
                  </span>
                )}
                {early && <span className="text-xs text-kraft">{DAY_NAMES[d]}: se toman pedidos antes de que abra el local.</span>}
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
