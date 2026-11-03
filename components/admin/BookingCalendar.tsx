"use client";

import { useMemo, useState, useTransition } from "react";
import { saveBooking } from "@/app/admin/actions";
import { bookingAhead, DEFAULT_AHEAD_DAYS, MAX_BOOKING_SPAN, type BookingConfig } from "@/lib/booking";
import { addDays, longDate, MON_LONG, parseISO, parts } from "@/lib/dates";
import { cx } from "@/lib/format";
import type { DayHours } from "@/lib/schema";
import { AButton, Card, PageHead, Segmented, useRun, useToast } from "./ui";

const WEEK = ["LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB", "DOM"];
const pad = (n: number) => String(n).padStart(2, "0");
const iso = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;

type Mode = "range" | "block";

/**
 * Calendario donde el local define hasta qué día se reserva por la web y qué días cierra.
 * El rango es móvil: siempre arranca hoy y llega hasta hoy + N días, así que se renueva solo cada día.
 */
export function BookingCalendar({ initial, today, week }: { initial: BookingConfig; today: string; week: DayHours[] }) {
  const run = useRun();
  const flash = useToast();
  const [saving, start] = useTransition();
  const [mode, setMode] = useState<Mode>("range");
  /** Días hacia adelante (null: valor por defecto). */
  const [ahead, setAhead] = useState<number | null>(initial.from && initial.to ? bookingAhead(initial) : null);
  const [blocked, setBlocked] = useState<string[]>(initial.blocked);
  const t = parts(today);
  const [cursor, setCursor] = useState({ y: t.year, m: t.month });

  const days = ahead ?? DEFAULT_AHEAD_DAYS;
  const effective = useMemo(() => ({ from: today, to: addDays(today, days) }), [today, days]);
  const usingDefault = ahead === null;
  const closedWeekday = (d: string) => !!week.find((x) => x.day === parts(d).dow)?.closed;
  const diff = (a: string, b: string) => Math.round((parseISO(b).getTime() - parseISO(a).getTime()) / 86_400_000);

  const click = (d: string) => {
    if (d < today) return;
    if (mode === "block") {
      if (d < effective.from || d > effective.to) {
        flash("Elegí un día dentro del rango reservable.", "error");
        return;
      }
      setBlocked((b) => (b.includes(d) ? b.filter((x) => x !== d) : [...b, d].sort()));
      return;
    }
    // Un solo toque: ese es el último día reservable de hoy; mañana el rango se corre un día solo.
    if (diff(today, d) > MAX_BOOKING_SPAN - 1) {
      flash(`Se puede reservar hasta ${MAX_BOOKING_SPAN - 1} días hacia adelante.`, "error");
      return;
    }
    setAhead(diff(today, d));
  };

  const save = () =>
    start(async () => {
      await run(saveBooking({ ahead, blocked }), "Calendario guardado. El sitio ya usa estos días.");
    });

  const move = (delta: number) =>
    setCursor((c) => {
      const idx = c.y * 12 + c.m + delta;
      const next = { y: Math.floor(idx / 12), m: idx % 12 };
      return next.y * 12 + next.m < t.year * 12 + t.month ? c : next;
    });

  const second = cursor.m === 11 ? { y: cursor.y + 1, m: 0 } : { y: cursor.y, m: cursor.m + 1 };

  const month = ({ y, m }: { y: number; m: number }) => {
    const lead = (parts(iso(y, m, 1)).dow + 6) % 7;
    const days = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
    const cells: (string | null)[] = [...Array<null>(lead).fill(null), ...Array.from({ length: days }, (_, i) => iso(y, m, i + 1))];
    return (
      <div key={`${y}-${m}`} className="flex flex-col gap-2">
        <h3 className="m-0 font-display text-xl font-semibold tracking-[.06em] uppercase">
          {MON_LONG[m]} {y}
        </h3>
        <div className="grid grid-cols-7 gap-1" role="group" aria-label={`${MON_LONG[m]} ${y}`}>
          {WEEK.map((w) => (
            <span key={w} className="py-1 text-center font-mono text-[10px] text-panel-muted">
              {w}
            </span>
          ))}
          {cells.map((d, i) => {
            if (!d) return <span key={`e${i}`} />;
            const past = d < today;
            const inRange = !past && d >= effective.from && d <= effective.to;
            const closedDay = closedWeekday(d);
            const isBlocked = blocked.includes(d) || (closedDay && inRange);
            const edge = d === effective.from ? "Primer día" : d === effective.to ? "Último día" : null;
            const label = `${longDate(d)}${edge ? `, ${edge.toLowerCase()} reservable` : inRange ? ", reservable" : ""}${closedDay ? ", cerrado por horario" : isBlocked ? ", cerrado" : ""}`;
            return (
              <button
                key={d}
                type="button"
                disabled={past || (closedDay && mode === "block")}
                aria-label={label}
                aria-pressed={mode === "block" ? isBlocked : inRange}
                onClick={() => click(d)}
                className={cx(
                  "flex min-h-11.5 flex-col items-center justify-center gap-px rounded border text-sm",
                  past && "cursor-default border-transparent text-panel-muted/50",
                  !past && !inRange && "border-bone/10 text-panel-soft hover:border-bone/30",
                  inRange && !isBlocked && "border-panel-text/40 bg-panel-hover text-panel-text",
                  inRange && isBlocked && "border-dashed border-sumeria-light bg-transparent text-sumeria-light",
                  edge && "border-2 border-panel-text font-bold",
                )}
              >
                <span className={cx(isBlocked && inRange && "line-through")}>{parts(d).day}</span>
                {edge && <span className="font-mono text-[8.5px] leading-none uppercase">{edge === "Primer día" ? "desde" : "hasta"}</span>}
                {isBlocked && inRange && !edge && <span className="font-mono text-[8.5px] leading-none uppercase">cerrado</span>}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <>
      <PageHead kicker="Reservas online" title="Calendario de reservas">
        <AButton variant="primary" onClick={save} disabled={saving}>
          {saving ? "Guardando…" : "Guardar"}
        </AButton>
      </PageHead>
      <div className="flex max-w-250 flex-col gap-4 px-5 pt-5 pb-12 md:px-8">
        <Card className="flex flex-col gap-3 p-4.5">
          <h2 className="m-0 font-display text-[clamp(28px,4vw,40px)] leading-[1.05] font-semibold uppercase">
            Se puede reservar hasta los próximos {days} días
          </h2>
          <div className="flex flex-wrap items-center gap-3">
            <Segmented
              value={mode}
              onChange={setMode}
              options={[
                ["range", "Elegir hasta qué día"],
                ["block", "Cerrar días puntuales"],
              ]}
              className="w-full max-w-90"
            />
            {!usingDefault && (
              <AButton
                variant="link"
                className="text-[13px]"
                onClick={() => setAhead(null)}
              >
                Volver al valor por defecto
              </AButton>
            )}
            {blocked.length > 0 && (
              <AButton variant="link" className="text-[13px]" onClick={() => setBlocked([])}>
                Reabrir todos los días cerrados
              </AButton>
            )}
          </div>
          <span className="text-[12.5px] text-panel-muted">
            {mode === "range"
              ? "Tocá el último día que querés ofrecer: el rango siempre arranca hoy y se corre solo cada día."
              : "Tocá un día del rango para cerrarlo (feriados, eventos privados) o volver a abrirlo."}
          </span>
        </Card>

        <Card className="flex flex-col gap-4 p-4.5">
          <div className="flex items-center justify-between">
            <AButton size="sm" onClick={() => move(-1)} disabled={cursor.y * 12 + cursor.m <= t.year * 12 + t.month} aria-label="Mes anterior">
              ← Anterior
            </AButton>
            <AButton size="sm" onClick={() => move(1)} aria-label="Mes siguiente">
              Siguiente →
            </AButton>
          </div>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,300px),1fr))] gap-6">
            {month(cursor)}
            {month(second)}
          </div>
        </Card>
        <p className="m-0 text-[12.5px] text-panel-muted">
          Esto solo afecta las reservas online. Los días que el local cierra por horario (ver Datos del local) se marcan solos como cerrados. Desde el panel siempre podés cargar reservas a mano en cualquier día. Para hoy, el sitio deja de
          tomar reservas a la hora de apertura de ese día (ver Datos del local) y ofrece consultar por WhatsApp.
        </p>
      </div>
    </>
  );
}
