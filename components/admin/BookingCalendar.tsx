"use client";

import { useMemo, useState, useTransition } from "react";
import { saveBooking } from "@/app/admin/actions";
import { bookingRange, DEFAULT_AHEAD_DAYS, MAX_BOOKING_SPAN, type BookingConfig } from "@/lib/booking";
import { addDays, longDate, MON_LONG, parts } from "@/lib/dates";
import { cx } from "@/lib/format";
import { AButton, Card, PageHead, Segmented, useRun, useToast } from "./ui";

const WEEK = ["LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB", "DOM"];
const pad = (n: number) => String(n).padStart(2, "0");
const iso = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;

type Mode = "range" | "block";

/** Calendario donde el local define desde/hasta qué día se reserva por la web y qué días cierra. */
export function BookingCalendar({ initial, today }: { initial: BookingConfig; today: string }) {
  const run = useRun();
  const flash = useToast();
  const [saving, start] = useTransition();
  const [mode, setMode] = useState<Mode>("range");
  const [from, setFrom] = useState<string | null>(initial.from);
  const [to, setTo] = useState<string | null>(initial.to);
  // Mientras se elige el rango: primer click fijado, esperando el segundo.
  const [anchor, setAnchor] = useState<string | null>(null);
  const [blocked, setBlocked] = useState<string[]>(initial.blocked);
  const t = parts(today);
  const [cursor, setCursor] = useState({ y: t.year, m: t.month });

  const effective = useMemo(() => bookingRange({ from, to, blocked }, today), [from, to, blocked, today]);
  const usingDefault = from === null && to === null;

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
    if (!anchor) {
      setAnchor(d);
      setFrom(d);
      setTo(d);
      return;
    }
    const [a, b] = anchor <= d ? [anchor, d] : [d, anchor];
    if (b > addDays(a, MAX_BOOKING_SPAN - 1)) {
      flash(`El rango puede abarcar hasta ${MAX_BOOKING_SPAN} días.`, "error");
      return;
    }
    setFrom(a);
    setTo(b);
    setAnchor(null);
  };

  const save = () =>
    start(async () => {
      await run(saveBooking({ from, to, blocked }), "Calendario guardado. El sitio ya usa estos días.");
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
            const isBlocked = blocked.includes(d);
            const edge = d === effective.from ? "Primer día" : d === effective.to ? "Último día" : null;
            const label = `${longDate(d)}${edge ? `, ${edge.toLowerCase()} reservable` : inRange ? ", reservable" : ""}${isBlocked ? ", cerrado" : ""}`;
            return (
              <button
                key={d}
                type="button"
                disabled={past}
                aria-label={label}
                aria-pressed={mode === "block" ? isBlocked : inRange}
                onClick={() => click(d)}
                className={cx(
                  "flex min-h-[46px] flex-col items-center justify-center gap-px rounded border text-sm",
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
      <div className="flex max-w-[1000px] flex-col gap-4 px-5 pt-5 pb-12 md:px-8">
        <Card className="flex flex-col gap-3 p-[18px]">
          <span className="font-mono text-[10.5px] tracking-[.05em] text-panel-muted uppercase">Hoy se puede reservar</span>
          <p className="m-0 text-[15px] leading-normal">
            Desde el <strong>{longDate(effective.from)}</strong> hasta el <strong>{longDate(effective.to)}</strong>
            {blocked.filter((d) => d >= effective.from && d <= effective.to).length > 0 &&
              `, salvo ${blocked.filter((d) => d >= effective.from && d <= effective.to).length} día(s) cerrado(s)`}
            .
          </p>
          {usingDefault && (
            <span className="text-[12.5px] text-panel-muted">
              Es el valor por defecto (hoy más {DEFAULT_AHEAD_DAYS} días). Tocá dos días del calendario para fijar tu propio rango.
            </span>
          )}
          {anchor && <span className="text-[12.5px] text-kraft">Elegí ahora el último día del rango.</span>}
          <div className="flex flex-wrap items-center gap-3">
            <Segmented
              value={mode}
              onChange={(m) => {
                setMode(m);
                setAnchor(null);
              }}
              options={[
                ["range", "Elegir el rango"],
                ["block", "Cerrar días puntuales"],
              ]}
              className="w-full max-w-[360px]"
            />
            {!usingDefault && (
              <AButton
                variant="link"
                className="text-[13px]"
                onClick={() => {
                  setFrom(null);
                  setTo(null);
                  setAnchor(null);
                }}
              >
                Volver al rango por defecto
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
              ? "Tocá el primer día y después el último. Los días anteriores a hoy no se pueden elegir."
              : "Tocá un día del rango para cerrarlo (feriados, eventos privados) o volver a abrirlo."}
          </span>
        </Card>

        <Card className="flex flex-col gap-4 p-[18px]">
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
          Esto solo afecta las reservas online. Desde el panel siempre podés cargar reservas a mano en cualquier día. Para hoy, el sitio deja de
          tomar reservas a las 19:30 y ofrece consultar por WhatsApp.
        </p>
      </div>
    </>
  );
}
