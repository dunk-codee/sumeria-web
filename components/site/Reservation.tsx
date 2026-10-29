"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { PlanData } from "@/lib/data";
import { bookingDays, isPastCutoff, type BookingConfig } from "@/lib/booking";
import type { SeatingOption, SeatingTier } from "@/lib/combos";
import { DOW, longDate, MON, parts, shortDate, todayISO } from "@/lib/dates";
import { cx, plural, tablesLabel } from "@/lib/format";
import { MAX_PEOPLE, SAME_DAY_CUTOFF, TURN } from "@/lib/turns";
import { sameDayConsultMessage, waLink } from "@/lib/whatsapp";
import { FloorPlan, type PlanGroup, type PlanTable } from "../FloorPlan";
import { button } from "../ui";
import { XLoader, XMark } from "../XMark";
import { SITE_CHAIR, SITE_TABLE, SITE_TABLE_ARIA, type SiteTableKind } from "./tableStyles";

type Status = "free" | "pend" | "res";
type LastRes = { table: string; name: string; date: string; people: number };
type Availability = {
  date: string;
  tables: { n: number; capacity: number; status: Status }[];
  tier: SeatingTier;
  options: SeatingOption[];
  cutoff: boolean;
};

const field = "rounded-xs border bg-coal px-3.5 text-base text-bone outline-none placeholder:text-stone-4 focus:border-bone";
const h3 = "m-0 font-display text-xl font-medium tracking-[.08em] uppercase";
const sameSet = (a: number[], b: number[]) => a.length === b.length && [...a].sort().join() === [...b].sort().join();

export function Reservation({ plan, whatsapp, booking }: { plan: PlanData; whatsapp: string; booking: BookingConfig }) {
  const [today, setToday] = useState<string | null>(null);
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [date, setDate] = useState<string>("");
  const [people, setPeople] = useState(2);
  /** Mesa elegida, o las dos si se juntan. */
  const [selection, setSelection] = useState<number[]>([]);
  /** Mesa tocada para juntar con otra: se muestran sus pares posibles. */
  const [anchor, setAnchor] = useState<number | null>(null);
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
    /* eslint-disable react-hooks/set-state-in-effect -- reinicia el estado al cambiar la consulta */
    setLoadErr(false);
    setAvail(null);
    /* eslint-enable react-hooks/set-state-in-effect */
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
  const selTables = selection.map((n) => plan.tables.find((t) => t.n === n)).filter((t) => t != null);
  const selCap = selTables.reduce((a, t) => a + t.capacity, 0);
  const selLabel = tablesLabel(selection);
  // Corte de hoy: lo calcula el cliente con la hora argentina y lo confirma el servidor.
  const cutoff = Boolean(date) && (isPastCutoff(date, new Date(nowMs)) || (avail?.date === date && avail.cutoff) || cutoffDate === date);

  // Opciones de lugar para el grupo (ver lib/combos.ts): mesas solas y pares (vecinos o, si no queda ninguno, separados).
  const options = useMemo(() => (avail && !cutoff ? avail.options : []), [avail, cutoff]);
  const tier: SeatingTier = avail && !cutoff ? avail.tier : "none";
  const singles = useMemo(() => new Set(options.filter((o) => o.tables.length === 1).map((o) => o.tables[0])), [options]);
  const pairs = useMemo(() => options.filter((o) => o.tables.length === 2), [options]);
  const pairsWith = (n: number) => pairs.filter((o) => o.tables.includes(n));
  const anchorPairs = anchor == null ? [] : pairsWith(anchor);
  const partners = new Set(anchorPairs.flatMap((o) => o.tables.filter((n) => n !== anchor)));
  const selOption = options.find((o) => sameSet(o.tables, selection));
  const noFree = statuses != null && !cutoff && tier === "none";

  const kindOf = (n: number): SiteTableKind => {
    const st: Status = statuses?.[n] ?? "free";
    if (selection.includes(n)) return "sel";
    if (st !== "free") return st;
    if (n === anchor) return "anchor";
    if (partners.has(n)) return "partner";
    return singles.has(n) || pairsWith(n).length ? "free" : "small";
  };

  const changeQuery = (patch: () => void) => {
    patch();
    setSelection([]);
    setAnchor(null);
  };

  const choosePair = (o: SeatingOption) => {
    setSelection(o.tables);
    setAnchor(null);
  };

  const pick = (n: number) => {
    if (cutoff || statuses == null) return;
    const kind = kindOf(n);
    if (kind === "partner" && anchor != null) {
      const o = anchorPairs.find((p) => p.tables.includes(n));
      if (o) choosePair(o);
      return;
    }
    if (kind === "anchor") {
      setAnchor(null);
      return;
    }
    if (singles.has(n)) {
      setSelection([n]);
      setAnchor(null);
      return;
    }
    // Mesa de un par pegado que alcanza: se eligen las dos de una (no hace falta pasar por el cuadro).
    const joined = pairsWith(n).find((o) => o.joined);
    if (joined) {
      choosePair(joined);
      return;
    }
    if (pairsWith(n).length) {
      setSelection([]);
      setAnchor(n);
    }
  };

  const planFor = (portrait: boolean): PlanTable[] =>
    plan.tables.map((t) => {
      const kind = kindOf(t.n);
      const lug = portrait ? "LUG." : "LUGARES";
      const sub = { sel: "TU MESA", free: lug, small: lug, pend: "PEND.", res: "OCUP.", anchor: portrait ? "ELEG." : "ELEGIDA", partner: "JUNTAR" }[kind];
      const clickable = !cutoff && statuses != null && (kind === "free" || kind === "anchor" || kind === "partner");
      return {
        ...t,
        round: t.shape === "round",
        className: SITE_TABLE[kind],
        chair: SITE_CHAIR[kind],
        capacity: t.capacity,
        disabled: !clickable && kind !== "sel",
        aria: `Mesa ${t.n}, ${t.capacity} personas, ${SITE_TABLE_ARIA[kind]}`,
        onClick: () => pick(t.n),
        content: (
          <>
            <span className="font-display text-[17px] leading-none font-semibold">{t.capacity}</span>
            <span className="font-mono text-[9px] leading-none tracking-[.02em]">{sub}</span>
          </>
        ),
      };
    });

  // Cuadros: el par elegido, o los pares vecinos de la mesa tocada. Los pares separados no llevan cuadro
  // (atravesaría el salón): la mesa compañera se marca "JUNTAR".
  const groups: PlanGroup[] =
    selection.length > 1
      ? selOption?.apart
        ? []
        : [{ key: "sel", tables: selection, active: true }]
      : anchorPairs
          .filter((o) => !o.apart)
          .map((o) => ({
            key: o.tables.join("-"),
            tables: o.tables,
            onClick: () => choosePair(o),
            aria: `Juntar ${tablesLabel(o.tables).toLowerCase()}, ${o.capacity} lugares`,
          }));

  const renderPlan = (dim = false) => (
    <div className={cx("relative transition-opacity", dim && "opacity-60")}>
      <FloorPlan fixtures={plan.fixtures} tables={planFor(true)} groups={groups} portrait className="d:hidden" />
      <FloorPlan fixtures={plan.fixtures} tables={planFor(false)} groups={groups} className="hidden d:block" />
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

  const pp = `${people} ${plural(people, "persona", "personas")}`;
  const legend: { kind: SiteTableKind; mark: string; label: string; desc: string }[] = [
    { kind: "free", mark: "4", label: "Disponible", desc: "Tocala para elegirla" },
    { kind: "sel", mark: "✓", label: "Tu elección", desc: "La mesa que elegiste" },
    ...(pairs.length ? [{ kind: "partner" as const, mark: "+", label: "Para juntar", desc: "Se puede juntar con la mesa que tocaste" }] : []),
    { kind: "pend", mark: "PEND", label: "Pendiente de confirmar", desc: "Alguien la pidió y la estamos confirmando" },
    { kind: "res", mark: "OCUP", label: "Reservada u ocupada", desc: "No disponible ese día" },
    { kind: "small", mark: "–", label: `No disponible para ${people}`, desc: "Te mostramos las que mejor se ajustan a tu grupo" },
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
      if (res.status === 409 || data.code === "unavailable") {
        setSelection([]);
        setAnchor(null);
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
      setAnchor(null);
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
  const summary = `${shortDate(date)} · ${pp}`;
  const consultHref = waLink(whatsapp, sameDayConsultMessage(people, name));
  const cutoffNotice = cutoff && (
    <div className="flex flex-col gap-3 rounded-xs border-[1.5px] border-sumeria bg-[#1A0F0E] p-5.5" role="alert">
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

  // Línea de disponibilidad del paso 1 (sin plano): cuánto lugar queda para el grupo ese día.
  const availLine = cutoff ? null : loadErr ? (
    <span className="flex flex-wrap items-center gap-3 text-[15px] text-sand">
      No pudimos traer la disponibilidad.
      <button type="button" onClick={() => setReload((r) => r + 1)} className={button({ variant: "outline", size: "sm" })}>
        Reintentar
      </button>
    </span>
  ) : statuses == null ? (
    <XLoader size={16} label="Buscando mesas…" />
  ) : tier === "none" ? (
    // Tarjeta roja: ícono X + texto (el estado no depende solo del color).
    <div className="flex max-w-155 items-start gap-3 rounded-xs border-[1.5px] border-sumeria bg-alert-bg px-4 py-3.5" role="status">
      <XMark size={16} stroke={4} className="mt-0.5 text-sumeria" />
      <span className="text-[15px] leading-normal text-bone">
        No quedan mesas para {pp} este día. Probá otro día o{" "}
        <a href={waLink(whatsapp, "¡Hola Sumeria! Quiero reservar una mesa.")} target="_blank" rel="noopener noreferrer" className="underline">
          escribinos por WhatsApp
        </a>
        .
      </span>
    </div>
  ) : (
    // Tarjeta verde, sin números ni detalles (mesa sola, juntar o separadas): eso se ve en el plano del paso 2.
    <div className="flex max-w-155 items-center gap-3 rounded-xs border-[1.5px] border-ok bg-ok-bg px-4 py-3.5" role="status">
      <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" aria-hidden className="shrink-0 text-ok">
        <path d="M5 12.5l4.5 4.5L19 7" />
      </svg>
      <span className="text-[15px] leading-normal text-bone">Hay lugar para {pp} este día.</span>
    </div>
  );

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
                      "flex w-18 flex-none flex-col items-center gap-0.75 rounded-xs border pt-2.5 pb-3",
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
                className="flex h-13 w-13 items-center justify-center rounded-xs border border-bone/25 text-[26px]"
              >
                −
              </button>
              <div className="flex items-baseline gap-2" aria-live="polite">
                <span className="font-display text-[42px] leading-none font-semibold">{people}</span>
                <span className="font-display text-base tracking-widest text-stone-2 uppercase">{plural(people, "persona", "personas")}</span>
              </div>
              <button
                type="button"
                onClick={() => changeQuery(() => setPeople((p) => Math.min(MAX_PEOPLE, p + 1)))}
                aria-label="Más personas"
                className="flex h-13 w-13 items-center justify-center rounded-xs border border-bone/25 text-[26px]"
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
          <div className="col-span-full flex flex-col gap-4">
            {availLine && <div aria-live="polite">{availLine}</div>}
            {/* Sin lugar el botón no se muestra: la tarjeta roja ya ofrece otro día o WhatsApp. */}
            {!noFree && (
              <button
                type="button"
                disabled={cutoff || !date || statuses == null}
                onClick={() => {
                  // Si el grupo no entra en una mesa sola y hay mesas pegadas que alcanzan, ya van elegidas (se pueden cambiar).
                  const joined = options.find((o) => o.joined);
                  if (!singles.size && joined && !selection.length) setSelection(joined.tables);
                  goStep(2);
                }}
                className={cx(button({ variant: cutoff || !date || statuses == null ? "disabled" : "primary" }), "w-full max-w-85 py-4.25")}
              >
                Ver mesas disponibles
              </button>
            )}
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="flex flex-col gap-4">
          <BackButton onClick={() => goStep(1)} />
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
            <div className="flex flex-col gap-3 rounded-xs border-[1.5px] border-sumeria bg-[#1A0F0E] p-5.5">
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
                <a href={waLink(whatsapp)} target="_blank" rel="noopener noreferrer" className="px-1 py-3 font-display text-sm tracking-widest uppercase underline">
                  Escribinos por WhatsApp
                </a>
              </div>
            </div>
          )}

          {pairs.length > 0 && (
            <div className="flex flex-col gap-3 rounded-xs border border-bone/14 bg-coal p-4.5">
              <h3 className="m-0 font-display text-xl leading-[1.05] font-semibold tracking-[.06em] uppercase">Juntar mesas</h3>
              <p className="m-0 text-[14.5px] leading-normal text-sand">
                {tier === "apart"
                  ? `No quedan mesas una al lado de la otra para ${pp}. Podés elegir dos separadas: las juntamos nosotros. `
                  : singles.size
                    ? "Juntando dos mesas aprovechás mejor los lugares. "
                    : `No hay una mesa sola para ${pp}: juntá dos. `}
                {anchor == null ? "Tocá una mesa en el plano y te mostramos con cuáles se puede juntar." : `¿Con cuál juntás la mesa ${anchor}?`}
              </p>
              {anchor != null && (
                <div className="flex flex-wrap gap-2" role="group" aria-label={`Mesas para juntar con la mesa ${anchor}`}>
                  {anchorPairs.map((o) => {
                    const other = o.tables.find((n) => n !== anchor)!;
                    return (
                      <button
                        key={o.tables.join("-")}
                        type="button"
                        onClick={() => choosePair(o)}
                        className="flex min-h-11 flex-col gap-1 rounded-xs border-[1.5px] border-bone/18 bg-ink px-4 py-2.5 text-left hover:border-sumeria"
                      >
                        <span className="font-display text-lg font-semibold uppercase">Con la mesa {other}</span>
                        <span className="font-mono text-xs text-stone-2">
                          {o.capacity} lugares juntos{o.apart ? " · separadas" : ""}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          <div className="flex flex-wrap items-start gap-6">
            <div className="flex min-w-0 flex-[1_1_560px] flex-col gap-2.5">
              <div className="flex flex-wrap justify-between gap-2.5 font-mono text-[10.5px] tracking-wider text-stone-3 uppercase">
                <span>Plano del salón · vista desde arriba</span>
              </div>
              {renderPlan(noFree)}
            </div>
            <div className="flex flex-[1_1_280px] flex-col gap-4.5">
              <div className="flex flex-col gap-2.5">
                <span className="font-mono text-[10.5px] tracking-wider text-stone-3 uppercase">Referencias</span>
                <Legend items={legend} />
              </div>
              <div className={cx("flex flex-col gap-1.5 rounded-xs border bg-coal p-4", selTables.length ? "border-sumeria" : "border-bone/14")} aria-live="polite">
                <span className="font-mono text-[10.5px] text-stone-3 uppercase">{selTables.length > 1 ? "Tus mesas" : "Tu mesa"}</span>
                <span className="font-display text-2xl leading-[1.05] font-semibold uppercase">{selTables.length ? selLabel : "Elegí una mesa"}</span>
                <span className="text-sm text-stone-2">
                  {selTables.length > 1
                    ? selOption?.apart
                      ? `${selCap} lugares · las juntamos para ustedes`
                      : selOption?.joined
                        ? `Mesas pegadas · ${selCap} lugares`
                        : `Mesas juntas · ${selCap} lugares`
                    : selTables.length
                      ? `Hasta ${selTables[0].capacity} personas · ${selTables[0].location}`
                      : anchor != null
                        ? `Tocá el cuadro o la mesa marcada "Juntar" para completar.`
                        : `Tocá una mesa disponible para ${people} en el plano.`}
                </span>
              </div>
              <button
                type="button"
                disabled={!selTables.length || cutoff}
                onClick={() => selTables.length && !cutoff && goStep(3)}
                className={cx(button({ variant: selTables.length && !cutoff ? "primary" : "disabled" }), "py-4.25")}
              >
                Continuar
              </button>
            </div>
          </div>
        </div>
      )}

      {step === 3 && selTables.length > 0 && (
        <div className="flex flex-col gap-4">
          <BackButton onClick={() => goStep(2)} />
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
                  className={cx(field, "h-12.5", nameErr ? "border-sumeria-light" : "border-bone/20")}
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
                  className={cx(field, "h-12.5", phoneErr ? "border-sumeria-light" : "border-bone/20")}
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
              <button type="submit" disabled={sending || cutoff} className={cx(button({ variant: cutoff ? "disabled" : "primary" }), "py-4.25")}>
                {sending ? "Enviando…" : cutoff ? "Reservas de hoy cerradas" : "Enviar reserva"}
              </button>
              <span className="text-[13px] leading-normal text-stone-3">La reserva queda pendiente hasta que te confirmemos por WhatsApp.</span>
            </form>
            <div className="flex flex-col gap-3.5 rounded-xs border border-bone/14 bg-coal p-5.5">
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
                <dd className="m-0">
                  {selTables.length > 1 ? (selOption?.apart ? "Mesas separadas: las juntamos para ustedes" : "Mesas juntas") : selTables[0].location}
                </dd>
              </dl>
              <button type="button" onClick={() => goStep(2)} className="self-start font-mono text-xs text-stone-2 underline">
                Cambiar mesa
              </button>
            </div>
          </div>
        </div>
      )}

      {step === 4 && last && (
        <div className="flex max-w-155 flex-col gap-4.5" role="status">
          <XMark size={64} stroke={3.6} className="text-sumeria" />
          <h2 className="m-0 font-display text-[clamp(40px,5vw,64px)] leading-[.95] font-semibold uppercase">Recibimos tu reserva.</h2>
          <p className="m-0 text-xl leading-[1.4]">Te confirmamos por WhatsApp.</p>
          <div className="flex flex-col gap-3 rounded-xs border border-bone/14 bg-coal p-5">
            <div className="flex flex-wrap items-center justify-between gap-2.5">
              <span className="font-display text-[26px] font-semibold uppercase">{last.table}</span>
              <span className="rounded-xs border-[1.5px] border-dashed border-kraft px-2.25 py-1 font-mono text-[10.5px] text-kraft uppercase">
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

/** Volver al paso anterior: flecha visible además de los links "Cambiar". */
function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="-ml-1 flex h-11 items-center gap-2 self-start px-1 font-display text-sm tracking-[.14em] text-stone-2 uppercase transition-colors hover:text-bone"
    >
      <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M19 12H5M11 6l-6 6 6 6" />
      </svg>
      Volver
    </button>
  );
}

function Legend({ items }: { items: { kind: SiteTableKind; mark: string; label: string; desc: string }[] }) {
  return (
    <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
      {items.map((l) => (
        <li key={l.kind} className="flex items-center gap-3">
          <span className={cx("flex h-6.5 w-8.5 flex-none items-center justify-center rounded font-mono text-[9px]", SITE_TABLE[l.kind])}>{l.mark}</span>
          <div className="flex flex-col">
            <span className="text-sm font-semibold">{l.label}</span>
            <span className="text-[12.5px] text-stone-3">{l.desc}</span>
          </div>
        </li>
      ))}
    </ul>
  );
}
