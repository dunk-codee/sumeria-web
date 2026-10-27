"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { PlanData } from "@/lib/data";
import { bookingDays, isPastCutoff, type BookingConfig } from "@/lib/booking";
import type { Combo } from "@/lib/combos";
import { DOW, longDate, MON, parts, shortDate, todayISO } from "@/lib/dates";
import { cx, plural, tablesLabel } from "@/lib/format";
import { MAX_PEOPLE, SAME_DAY_CUTOFF, TURN } from "@/lib/turns";
import { sameDayConsultMessage, waLink } from "@/lib/whatsapp";
import { FloorPlan, type PlanTable } from "../FloorPlan";
import { button } from "../ui";
import { RedX, XLoader, XMark } from "../XMark";
import { SITE_CHAIR, SITE_TABLE, SITE_TABLE_ARIA, type SiteTableKind } from "./tableStyles";

type Status = "free" | "pend" | "res";
type LastRes = { table: string; name: string; date: string; people: number };
type Availability = { date: string; tables: { n: number; status: Status }[]; combos: Combo[]; cutoff: boolean };

const field = "rounded-xs border bg-coal px-3.5 text-base text-bone outline-none placeholder:text-stone-4 focus:border-bone";
const h3 = "m-0 font-display text-xl font-medium tracking-[.08em] uppercase";

export function Reservation({ plan, whatsapp, booking }: { plan: PlanData; whatsapp: string; booking: BookingConfig }) {
  const [today, setToday] = useState<string | null>(null);
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [date, setDate] = useState<string>("");
  const [people, setPeople] = useState(2);
  /** Mesa elegida, o varias si se eligió una combinación. */
  const [selection, setSelection] = useState<number[]>([]);
  const [avail, setAvail] = useState<Availability | null>(null);
  const [nowMs, setNowMs] = useState(0);
  const [cutoffDate, setCutoffDate] = useState<string | null>(null);
  const [loadErr, setLoadErr] = useState(false);
  const [reload, setReload] = useState(0);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [comment, setComment] = useState("");
  const [tried, setTried] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendErr, setSendErr] = useState<string | null>(null);
  const [last, setLast] = useState<LastRes | null>(null);

  // "Hoy" y la hora se calculan en el navegador (hora argentina), no en el prerender.
  useEffect(() => {
    const now = new Date();
    const t = todayISO(now);
    const open = bookingDays(booking, t).filter((d) => !d.blocked);
    const first = open.find((d) => !isPastCutoff(d.date, now)) ?? open[0];
    /* eslint-disable react-hooks/set-state-in-effect -- fecha del cliente */
    setToday(t);
    setNowMs(now.getTime());
    setDate(first?.date ?? "");
    /* eslint-enable react-hooks/set-state-in-effect */
    // El corte de las 19:30 puede llegar mientras la persona completa el formulario.
    const id = setInterval(() => setNowMs(Date.now()), 30_000);
    return () => clearInterval(id);
  }, [booking]);

  useEffect(() => {
    if (!date) return;
    const ctrl = new AbortController();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reinicia el estado al cambiar la consulta
    setLoadErr(false);
    fetch(`/api/availability?date=${date}&people=${people}`, { signal: ctrl.signal, cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((d: Availability) => setAvail(d))
      .catch((e) => {
        if (e?.name !== "AbortError") setLoadErr(true);
      });
    return () => ctrl.abort();
  }, [date, people, reload]);

  const dates = useMemo(() => (today ? bookingDays(booking, today) : []), [booking, today]);
  const statuses = useMemo(() => (avail ? Object.fromEntries(avail.tables.map((t) => [t.n, t.status])) : null), [avail]);
  const combos = avail?.combos ?? [];
  const selTables = selection.map((n) => plan.tables.find((t) => t.n === n)).filter((t) => t != null);
  const selCap = selTables.reduce((a, t) => a + t.capacity, 0);
  const selLabel = tablesLabel(selection);
  // Corte de hoy: lo calcula el cliente con la hora argentina y lo confirma el servidor.
  const cutoff = Boolean(date) && (isPastCutoff(date, new Date(nowMs)) || (avail?.date === date && avail.cutoff) || cutoffDate === date);

  const kinds = useMemo(() => {
    const out: Record<number, { kind: SiteTableKind; status: Status; selectable: boolean }> = {};
    for (const t of plan.tables) {
      const st: Status = statuses?.[t.n] ?? "free";
      const fits = t.capacity >= people;
      const selectable = statuses != null && !cutoff && st === "free" && fits;
      const kind: SiteTableKind = selection.includes(t.n) ? "sel" : st === "free" ? (fits ? "free" : "small") : st;
      out[t.n] = { kind, status: st, selectable };
    }
    return out;
  }, [plan.tables, statuses, people, selection, cutoff]);

  const freeT = plan.tables.filter((t) => kinds[t.n]?.status === "free");
  const fitN = plan.tables.filter((t) => kinds[t.n]?.selectable).length;
  const noFree = statuses != null && !cutoff && fitN === 0 && combos.length === 0;

  const changeQuery = (patch: () => void) => {
    patch();
    setSelection([]);
  };

  const pick = (n: number, advance: boolean) => {
    if (!kinds[n]?.selectable) return;
    setSelection([n]);
    if (advance) setStep(2);
  };

  const planFor = (portrait: boolean, advance: boolean): PlanTable[] =>
    plan.tables.map((t) => {
      const k = kinds[t.n];
      const lug = portrait ? "LUG." : "LUGARES";
      const sub = { sel: "TU MESA", free: lug, small: lug, pend: "PEND.", res: "OCUP." }[k.kind];
      return {
        ...t,
        round: t.shape === "round",
        className: SITE_TABLE[k.kind],
        chair: SITE_CHAIR[k.kind],
        capacity: t.capacity,
        grouped: k.kind === "sel" && selection.length > 1,
        disabled: !k.selectable && k.kind !== "sel",
        aria: `Mesa ${t.n}, ${t.capacity} personas, ${SITE_TABLE_ARIA[k.kind]}`,
        onClick: () => pick(t.n, advance),
        content: (
          <>
            <span className="font-display text-[17px] leading-none font-semibold">{t.capacity}</span>
            <span className="font-mono text-[9px] leading-none tracking-[.02em]">{sub}</span>
          </>
        ),
      };
    });

  const renderPlan = (advance: boolean, dim = false) => (
    <div className={cx("relative transition-opacity", dim && "opacity-60")}>
      <FloorPlan fixtures={plan.fixtures} tables={planFor(true, advance)} portrait className="d:hidden" />
      <FloorPlan fixtures={plan.fixtures} tables={planFor(false, advance)} className="hidden d:block" />
      {statuses == null && !loadErr && (
        <div className="absolute inset-0 flex items-center justify-center bg-ink/40">
          <XLoader label="Buscando mesas…" />
        </div>
      )}
      {loadErr && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-ink/80 p-6 text-center">
          <span className="text-[15px] text-sand">No pudimos traer la disponibilidad.</span>
          <button type="button" onClick={() => setReload((r) => r + 1)} className={button({ variant: "outline", size: "sm" })}>
            Reintentar
          </button>
        </div>
      )}
    </div>
  );

  const legend: { kind: SiteTableKind; mark: string; label: string; desc: string }[] = [
    { kind: "free", mark: "4", label: "Disponible", desc: "Tocala para elegirla" },
    { kind: "sel", mark: "✓", label: "Tu elección", desc: "La mesa que elegiste" },
    { kind: "pend", mark: "PEND", label: "Pendiente de confirmar", desc: "Alguien la pidió y la estamos confirmando" },
    { kind: "res", mark: "OCUP", label: "Reservada u ocupada", desc: "No disponible ese día" },
    { kind: "small", mark: "2", label: "Libre, pero chica", desc: `No alcanza para ${people} ${plural(people, "persona", "personas")}` },
  ];

  const submit = async () => {
    if (cutoff) return;
    if (!name.trim() || phone.replace(/\D/g, "").length < 7 || selTables.length === 0) {
      setTried(true);
      return;
    }
    setSending(true);
    setSendErr(null);
    try {
      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, people, tables: selection, name: name.trim(), phone: phone.trim(), comment: comment.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 422 && data.code === "cutoff") {
        setCutoffDate(date);
        setSendErr(null);
        return;
      }
      if (res.status === 409) {
        setSelection([]);
        setStep(2);
        setReload((r) => r + 1);
        setSendErr(data.error ?? "Esa mesa ya fue tomada. Elegí otra.");
        return;
      }
      if (!res.ok) {
        setSendErr(data.error ?? "No pudimos enviar la reserva. Probá de nuevo.");
        return;
      }
      setLast({ table: selLabel, name: name.trim(), date: longDate(date), people });
      setStep(4);
      setSelection([]);
      setTried(false);
      setReload((r) => r + 1);
      window.scrollTo({ top: 0 });
    } catch {
      setSendErr("No pudimos enviar la reserva. Revisá tu conexión.");
    } finally {
      setSending(false);
    }
  };

  if (!today) {
    return (
      <div className="py-10">
        <XLoader label="Cargando reservas…" />
      </div>
    );
  }

  const nameErr = tried && !name.trim();
  const phoneErr = tried && phone.replace(/\D/g, "").length < 7;
  const summary = `${shortDate(date)} · ${people} ${plural(people, "persona", "personas")}`;
  const consultHref = waLink(whatsapp, sameDayConsultMessage(people, name));
  const cutoffNotice = cutoff && (
    <div className="flex flex-col gap-3 rounded-xs border-[1.5px] border-sumeria bg-[#1A0F0E] p-[22px]" role="alert">
      <div className="flex items-center gap-2.5">
        <XMark size={16} stroke={4} className="text-sumeria" />
        <h3 className="m-0 font-display text-2xl leading-[1.05] font-semibold uppercase">Las reservas online para hoy ya cerraron</h3>
      </div>
      <p className="m-0 text-[15px] leading-normal text-sand">
        Desde las {SAME_DAY_CUTOFF} no tomamos reservas por la web para el mismo día. Escribinos por WhatsApp y te decimos si queda una mesa libre.
      </p>
      <a href={consultHref} target="_blank" rel="noopener noreferrer" className={cx(button({ variant: "primary" }), "self-start")}>
        Consultar para hoy por WhatsApp
      </a>
    </div>
  );
  const goStep = (n: 1 | 2 | 3) => {
    setStep(n);
    setSendErr(null);
  };

  return (
    <>
      {step < 4 && (
        <div className="flex gap-2" aria-label="Pasos de la reserva">
          {(
            [
              ["01", "Día y personas"],
              ["02", "Mesa"],
              ["03", "Tus datos"],
            ] as const
          ).map(([num, label], i) => {
            const n = (i + 1) as 1 | 2 | 3;
            const active = step === n;
            const done = step > n;
            return (
              <button
                key={num}
                type="button"
                disabled={!done}
                onClick={() => done && goStep(n)}
                aria-current={active ? "step" : undefined}
                className={cx(
                  "flex flex-1 flex-col gap-1.5 border-t-2 pt-2.5 text-left disabled:cursor-default",
                  active ? "border-sumeria" : done ? "border-bone" : "border-bone/18",
                )}
              >
                <span className={cx("font-mono text-[11px]", active || done ? "text-bone" : "text-stone-4")}>{num}</span>
                <span className={cx("font-display text-[clamp(13px,1.4vw,17px)] tracking-[.08em] uppercase", active || done ? "text-bone" : "text-stone-4")}>
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {step === 1 && (
        <>
          <div className="mb-2 flex flex-col gap-3">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div className="flex flex-col gap-1.5">
                <span className="font-mono text-[10.5px] tracking-[.05em] text-stone-3 uppercase">
                  Disponibilidad · {shortDate(date)}
                </span>
                <span className="font-display text-[clamp(22px,2.4vw,30px)] leading-[1.05] font-semibold uppercase">
                  {statuses == null
                    ? "Buscando mesas…"
                    : freeT.length
                      ? `${freeT.length} ${plural(freeT.length, "mesa libre", "mesas libres")} · ${freeT.reduce((a, t) => a + t.capacity, 0)} lugares`
                      : "Sin mesas libres este día"}
                </span>
                {statuses != null && (
                  <span className="text-sm text-stone-2">
                    {fitN
                      ? `${fitN} ${plural(fitN, "sirve", "sirven")} para ${people} ${plural(people, "persona", "personas")}. Cambiá día o personas abajo y el plano se actualiza.`
                      : combos.length
                        ? `Ninguna mesa sola alcanza para ${people} ${plural(people, "persona", "personas")}, pero podés combinar mesas en el próximo paso.`
                        : `Ninguna alcanza para ${people} ${plural(people, "persona", "personas")}. Probá otro día.`}
                  </span>
                )}
              </div>
              <span className="font-mono text-[10.5px] tracking-[.05em] text-stone-3 uppercase">Tocá una mesa libre para elegirla</span>
            </div>
            <div className="max-w-[880px]">
              {renderPlan(true)}
            </div>
            <Legend items={legend} compact />
          </div>

          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,340px),1fr))] items-start gap-[clamp(28px,4vw,56px)]">
            <div className="col-span-full flex flex-col gap-3">
              <h3 className={h3}>¿Qué día?</h3>
              {dates.length === 0 && (
                <span className="text-[15px] text-sand">
                  Por ahora no hay días abiertos para reservar online.{" "}
                  <a href={waLink(whatsapp, "¡Hola Sumeria! Quiero reservar una mesa.")} target="_blank" rel="noopener noreferrer" className="underline">
                    Escribinos por WhatsApp
                  </a>
                  .
                </span>
              )}
              <div className="no-scrollbar flex gap-2 overflow-x-auto pb-0.5">
                {dates.map(({ date: d, blocked }) => {
                  const on = d === date;
                  const p = parts(d);
                  return (
                    <button
                      key={d}
                      type="button"
                      aria-pressed={on}
                      disabled={blocked}
                      aria-label={`${longDate(d)}${blocked ? ", sin reservas online" : ""}`}
                      onClick={() => changeQuery(() => setDate(d))}
                      className={cx(
                        "flex w-[72px] flex-none flex-col items-center gap-[3px] rounded-xs border pt-2.5 pb-3",
                        blocked
                          ? "cursor-not-allowed border-dashed border-bone/18 bg-transparent text-stone-4"
                          : on
                            ? "border-sumeria-dark bg-sumeria-dark text-white"
                            : "border-bone/18 bg-coal text-bone",
                      )}
                    >
                      <span className="font-mono text-[10px] tracking-[.06em]">{d === today ? "HOY" : DOW[p.dow]}</span>
                      <span className={cx("font-display text-[30px] leading-none font-semibold", blocked && "line-through")}>{p.day}</span>
                      <span className="font-mono text-[10px]">{blocked ? "CERRADO" : MON[p.month]}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <h3 className={h3}>Horario</h3>
              <div className="flex flex-col gap-1.5 rounded-xs border-[1.5px] border-bone/18 bg-coal p-4">
                <span className="font-display text-lg font-semibold uppercase">Turno único</span>
                <span className="font-mono text-xs text-stone-2">{TURN.range}</span>
              </div>
              <span className="text-[13px] text-stone-3">Tu mesa queda guardada durante todo el servicio.</span>
            </div>
            <div className="flex flex-col gap-3">
              <h3 className={h3}>¿Cuántos son?</h3>
              <div className="flex items-center justify-between rounded-xs border border-bone/20 bg-coal p-2">
                <button
                  type="button"
                  onClick={() => changeQuery(() => setPeople((p) => Math.max(1, p - 1)))}
                  aria-label="Menos personas"
                  className="flex h-[52px] w-[52px] items-center justify-center rounded-xs border border-bone/25 text-[26px]"
                >
                  −
                </button>
                <div className="flex items-baseline gap-2" aria-live="polite">
                  <span className="font-display text-[42px] leading-none font-semibold">{people}</span>
                  <span className="font-display text-base tracking-[.1em] text-stone-2 uppercase">{plural(people, "persona", "personas")}</span>
                </div>
                <button
                  type="button"
                  onClick={() => changeQuery(() => setPeople((p) => Math.min(MAX_PEOPLE, p + 1)))}
                  aria-label="Más personas"
                  className="flex h-[52px] w-[52px] items-center justify-center rounded-xs border border-bone/25 text-[26px]"
                >
                  +
                </button>
              </div>
              <span className="text-[13px] text-stone-3">
                Para grupos de más de {MAX_PEOPLE},{" "}
                <a href={waLink(whatsapp, "¡Hola Sumeria! Quiero reservar para un grupo grande.")} target="_blank" rel="noopener noreferrer" className="underline">
                  escribinos por WhatsApp
                </a>
                .
              </span>
            </div>
            {cutoffNotice && <div className="col-span-full">{cutoffNotice}</div>}
            <div className="col-span-full">
              <button
                type="button"
                disabled={cutoff || !date}
                onClick={() => goStep(2)}
                className={cx(button({ variant: cutoff || !date ? "disabled" : "primary" }), "w-full max-w-[340px] py-[17px]")}
              >
                Ver mesas disponibles
              </button>
            </div>
          </div>
        </>
      )}

      {step === 2 && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-2.5 rounded-xs border border-bone/14 bg-coal px-4 py-3">
            <span className="font-display text-[17px] tracking-[.06em] uppercase">{summary}</span>
            <button type="button" onClick={() => goStep(1)} className="font-mono text-xs text-stone-2 underline">
              Cambiar
            </button>
          </div>

          {sendErr && (
            <div className="rounded-xs border-[1.5px] border-sumeria bg-[#1A0F0E] px-4 py-3 text-[15px] text-sand" role="alert">
              {sendErr}
            </div>
          )}

          {cutoffNotice}

          {noFree && (
            <div className="flex flex-col gap-3 rounded-xs border-[1.5px] border-sumeria bg-[#1A0F0E] p-[22px]">
              <div className="flex items-center gap-2.5">
                <XMark size={16} stroke={4} className="text-sumeria" />
                <h3 className="m-0 font-display text-2xl leading-[1.05] font-semibold uppercase">No quedan mesas para {people} este día</h3>
              </div>
              <p className="m-0 text-[15px] leading-normal text-sand">
                Probá con otro día. También podés escribirnos: si se libera una mesa, te avisamos.
              </p>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => goStep(1)} className={button({ variant: "outline", size: "sm" })}>
                  Elegir otro día
                </button>
                <a href={waLink(whatsapp)} target="_blank" rel="noopener noreferrer" className="px-1 py-3 font-display text-sm tracking-[.1em] uppercase underline">
                  Escribinos por WhatsApp
                </a>
              </div>
            </div>
          )}

          {!cutoff && combos.length > 0 && (
            <div className="flex flex-col gap-3 rounded-xs border border-bone/14 bg-coal p-[18px]">
              <h3 className="m-0 font-display text-xl leading-[1.05] font-semibold tracking-[.06em] uppercase">Combinar mesas</h3>
              <p className="m-0 text-[14.5px] leading-normal text-sand">
                {fitN
                  ? `Estas combinaciones aprovechan mejor los lugares que las mesas sueltas libres. `
                  : `No hay una mesa libre para ${people} ${plural(people, "persona", "personas")}. `}
                Podés juntar mesas que están una al lado de la otra:
              </p>
              <div className="flex flex-wrap gap-2" role="group" aria-label="Combinaciones de mesas">
                {combos.map((c) => {
                  const on = c.tables.join() === selection.join();
                  return (
                    <button
                      key={c.tables.join("-")}
                      type="button"
                      aria-pressed={on}
                      onClick={() => setSelection(c.tables)}
                      className={cx("flex min-h-11 flex-col gap-1 rounded-xs border-[1.5px] bg-ink px-4 py-2.5 text-left", on ? "border-sumeria" : "border-bone/18")}
                    >
                      <span className="flex items-center gap-2 font-display text-lg font-semibold uppercase">
                        {on && <RedX size={10} stroke={4} />}
                        {tablesLabel(c.tables)}
                      </span>
                      <span className="font-mono text-xs text-stone-2">{c.capacity} lugares juntos</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-start gap-6">
            <div className="flex min-w-0 flex-[1_1_560px] flex-col gap-2.5">
              <div className="flex flex-wrap justify-between gap-2.5 font-mono text-[10.5px] tracking-[.05em] text-stone-3 uppercase">
                <span>Plano del salón · vista desde arriba</span>
              </div>
              {renderPlan(false, noFree)}
            </div>
            <div className="flex flex-[1_1_280px] flex-col gap-[18px]">
              <div className="flex flex-col gap-2.5">
                <span className="font-mono text-[10.5px] tracking-[.05em] text-stone-3 uppercase">Referencias</span>
                <Legend items={legend} />
              </div>
              <div className={cx("flex flex-col gap-1.5 rounded-xs border bg-coal p-4", selTables.length ? "border-sumeria" : "border-bone/14")} aria-live="polite">
                <span className="font-mono text-[10.5px] text-stone-3 uppercase">{selTables.length > 1 ? "Tus mesas" : "Tu mesa"}</span>
                <span className="font-display text-2xl leading-[1.05] font-semibold uppercase">{selTables.length ? selLabel : "Elegí una mesa"}</span>
                <span className="text-sm text-stone-2">
                  {selTables.length > 1
                    ? `Mesas combinadas · ${selCap} lugares juntos`
                    : selTables.length
                      ? `Hasta ${selTables[0].capacity} personas · ${selTables[0].location}`
                      : `Tocá una mesa disponible para ${people} en el plano.`}
                </span>
              </div>
              <button
                type="button"
                disabled={!selTables.length || cutoff}
                onClick={() => selTables.length && !cutoff && goStep(3)}
                className={cx(button({ variant: selTables.length && !cutoff ? "primary" : "disabled" }), "py-[17px]")}
              >
                Continuar
              </button>
            </div>
          </div>
        </div>
      )}

      {step === 3 && selTables.length > 0 && (
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,340px),1fr))] items-start gap-[clamp(24px,4vw,56px)]">
          <form
            className="flex flex-col gap-3.5"
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
            noValidate
          >
            <label className="flex flex-col gap-1.5">
              <span className="text-[13px] font-semibold text-sand">Nombre y apellido</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Cómo te llamás"
                autoComplete="name"
                aria-invalid={nameErr}
                className={cx(field, "h-[50px]", nameErr ? "border-sumeria-light" : "border-bone/20")}
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[13px] font-semibold text-sand">Teléfono (WhatsApp)</span>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                inputMode="tel"
                autoComplete="tel"
                placeholder="3442 15 000000"
                aria-invalid={phoneErr}
                className={cx(field, "h-[50px]", phoneErr ? "border-sumeria-light" : "border-bone/20")}
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[13px] font-semibold text-sand">
                Comentario <span className="font-normal text-stone-3">(opcional)</span>
              </span>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                maxLength={300}
                placeholder="Cumpleaños, silla para bebé, alergias…"
                className={cx(field, "resize-y border-bone/20 py-3")}
              />
            </label>
            {(nameErr || phoneErr) && (
              <span className="text-[13px] text-sumeria-light" role="alert">
                Completá tu nombre y un teléfono para poder confirmarte.
              </span>
            )}
            {sendErr && (
              <span className="text-[13px] text-sumeria-light" role="alert">
                {sendErr}
              </span>
            )}
            {cutoffNotice}
            <button type="submit" disabled={sending || cutoff} className={cx(button({ variant: cutoff ? "disabled" : "primary" }), "py-[17px]")}>
              {sending ? "Enviando…" : cutoff ? "Reservas de hoy cerradas" : "Enviar reserva"}
            </button>
            <span className="text-[13px] leading-normal text-stone-3">La reserva queda pendiente hasta que te confirmemos por WhatsApp.</span>
          </form>
          <div className="flex flex-col gap-3.5 rounded-xs border border-bone/14 bg-coal p-[22px]">
            <span className="font-mono text-[10.5px] text-stone-3 uppercase">Resumen</span>
            <span className="font-display text-[34px] leading-none font-semibold uppercase">{selLabel}</span>
            <dl className="m-0 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-[15px]">
              <dt className="text-stone-3">Día</dt>
              <dd className="m-0">{longDate(date)}</dd>
              <dt className="text-stone-3">Horario</dt>
              <dd className="m-0">{TURN.range}</dd>
              <dt className="text-stone-3">Personas</dt>
              <dd className="m-0">{people}</dd>
              <dt className="text-stone-3">Ubicación</dt>
              <dd className="m-0">{selTables.length > 1 ? "Mesas combinadas, juntas" : selTables[0].location}</dd>
            </dl>
            <button type="button" onClick={() => goStep(2)} className="self-start font-mono text-xs text-stone-2 underline">
              Cambiar mesa
            </button>
          </div>
        </div>
      )}

      {step === 4 && last && (
        <div className="flex max-w-[620px] flex-col gap-[18px]" role="status">
          <XMark size={64} stroke={3.6} className="text-sumeria" />
          <h2 className="m-0 font-display text-[clamp(40px,5vw,64px)] leading-[.95] font-semibold uppercase">Recibimos tu reserva.</h2>
          <p className="m-0 text-xl leading-[1.4]">Te confirmamos por WhatsApp.</p>
          <div className="flex flex-col gap-3 rounded-xs border border-bone/14 bg-coal p-5">
            <div className="flex flex-wrap items-center justify-between gap-2.5">
              <span className="font-display text-[26px] font-semibold uppercase">{last.table}</span>
              <span className="rounded-xs border-[1.5px] border-dashed border-kraft px-[9px] py-1 font-mono text-[10.5px] text-kraft uppercase">
                Pendiente de confirmar
              </span>
            </div>
            <dl className="m-0 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-[15px]">
              <dt className="text-stone-3">A nombre de</dt>
              <dd className="m-0">{last.name}</dd>
              <dt className="text-stone-3">Día</dt>
              <dd className="m-0">{last.date}</dd>
              <dt className="text-stone-3">Horario</dt>
              <dd className="m-0">{TURN.range}</dd>
              <dt className="text-stone-3">Personas</dt>
              <dd className="m-0">{last.people}</dd>
            </dl>
            <span className="text-[13.5px] leading-normal text-stone-3">
              Guardamos la mesa para ese día mientras la confirmamos. Si necesitás cambiar algo, respondé el mensaje que te mandamos.
            </span>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <Link href="/carta" className={button({ variant: "primary", size: "md" })}>
              Ver la carta
            </Link>
            <Link href="/" className={button({ variant: "outline", size: "md" })}>
              Volver al inicio
            </Link>
          </div>
        </div>
      )}
    </>
  );
}

function Legend({ items, compact = false }: { items: { kind: SiteTableKind; mark: string; label: string; desc: string }[]; compact?: boolean }) {
  if (compact) {
    return (
      <ul className="m-0 flex max-w-[880px] list-none flex-wrap gap-x-[18px] gap-y-2 p-0">
        {items.map((l) => (
          <li key={l.kind} className="flex items-center gap-2">
            <span className={cx("flex h-5 w-[26px] flex-none items-center justify-center rounded font-mono text-[8.5px]", SITE_TABLE[l.kind])}>{l.mark}</span>
            <span className="text-[13px] text-sand">{l.label}</span>
          </li>
        ))}
      </ul>
    );
  }
  return (
    <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
      {items.map((l) => (
        <li key={l.kind} className="flex items-center gap-3">
          <span className={cx("flex h-[26px] w-[34px] flex-none items-center justify-center rounded font-mono text-[9px]", SITE_TABLE[l.kind])}>{l.mark}</span>
          <div className="flex flex-col">
            <span className="text-sm font-semibold">{l.label}</span>
            <span className="text-[12.5px] text-stone-3">{l.desc}</span>
          </div>
        </li>
      ))}
    </ul>
  );
}
