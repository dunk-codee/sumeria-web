"use client";

import Link from "next/link";
import { useState } from "react";
import type { AdminReservation } from "@/lib/admin-data";
import type { PlanData } from "@/lib/data";
import { DOW, longDate, parts } from "@/lib/dates";
import { cx, tablesLabel } from "@/lib/format";
import { TURN } from "@/lib/turns";
import { FloorPlan, type PlanTable } from "../FloorPlan";
import { XMark } from "../XMark";
import { NewReservationButton, NewReservationDrawer, SOURCE_LABEL, useResActions } from "./reservations";
import { AButton, Card, PANEL_TABLE, StatusTag } from "./ui";
import { PANEL_CHAIR } from "./styles";

type Props = {
  date: string;
  view: "list" | "plan";
  days: string[];
  today: string;
  week: AdminReservation[];
  plan: PlanData;
  address: string;
};

const href = (p: { date: string; view: string }) => `/admin/reservas?date=${p.date}&view=${p.view}`;

export function ReservationsBoard({ date, view, days, today, week, plan, address }: Props) {
  const a = useResActions(address);
  const [sel, setSel] = useState<number | null>(null);
  const [newAt, setNewAt] = useState<number | null>(null);

  const slot = week.filter((r) => r.date === date);
  const rows = slot.filter((r) => r.status !== "occ");
  const active = rows.filter((r) => r.status !== "canc");
  const byTable = new Map(slot.filter((r) => r.status !== "canc").flatMap((r) => r.tables.map((n) => [n, r] as const)));

  const tableOptions = (r: AdminReservation) =>
    plan.tables.map((t) => {
      const other = byTable.get(t.n);
      const busy = !!other && other.id !== r.id;
      return { n: t.n, label: `Mesa ${t.n} · ${t.capacity}p${busy ? " (ocupada)" : ""}`, busy };
    });

  const planTablesList: PlanTable[] = plan.tables.map((t) => {
    const r = byTable.get(t.n);
    const k = r ? (r.status === "occ" ? "occ" : r.status === "pend" ? "pend" : "conf") : "free";
    const sub = r ? (r.status === "occ" ? "SIN RESERVA" : r.tables.length > 1 ? `${r.name.split(" ")[0]} · comb.` : `${r.name.split(" ")[0]} · ${r.people}p`) : "LIBRE";
    return {
      ...t,
      round: t.shape === "round",
      chair: PANEL_CHAIR[k],
      capacity: t.capacity,
      className: cx(PANEL_TABLE[k], sel === t.n && "outline-2 outline-offset-[3px] outline-sumeria"),
      aria: `Mesa ${t.n}, ${t.capacity} lugares, ${sub.toLowerCase()}`,
      onClick: () => setSel(t.n),
      content: (
        <>
          <span className="font-display text-[15px] leading-none font-semibold">
            M{t.n} · {t.capacity}
          </span>
          <span className="max-w-[94%] truncate font-mono text-[9px] leading-[1.1]">{sub}</span>
        </>
      ),
    };
  });

  const selT = plan.tables.find((t) => t.n === sel);
  const selR = sel != null ? byTable.get(sel) : undefined;

  return (
    <>
      <div className="flex flex-col gap-[18px] border-b border-bone/8 px-5 pt-7 pb-[18px] md:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col gap-1">
            <span className="font-mono text-[11px] tracking-[.08em] text-panel-muted uppercase">Reservas</span>
            <h1 className="m-0 font-display text-[34px] leading-[1.05] font-semibold uppercase">{longDate(date)}</h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex overflow-hidden rounded border border-bone/20">
              {(
                [
                  ["list", "Lista"],
                  ["plan", "Plano"],
                ] as const
              ).map(([v, label]) => (
                <Link
                  key={v}
                  href={href({ date, view: v })}
                  aria-current={view === v ? "page" : undefined}
                  className={cx("flex h-9 items-center px-3.5 text-[13px] font-semibold", view === v ? "bg-panel-text text-panel-bg hover:text-panel-bg" : "text-panel-soft")}
                >
                  {label}
                </Link>
              ))}
            </div>
            <NewReservationButton days={days} date={date} />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="no-scrollbar flex gap-1.5 overflow-x-auto">
            {days.map((d) => {
              const on = d === date;
              const p = parts(d);
              const n = week.filter((r) => r.date === d && r.status !== "canc" && r.status !== "occ").length;
              const hasPend = week.some((r) => r.date === d && r.status === "pend");
              return (
                <Link
                  key={d}
                  href={href({ date: d, view })}
                  aria-current={on ? "date" : undefined}
                  className={cx(
                    "flex w-[58px] flex-none flex-col items-center gap-px rounded border py-[7px] text-panel-text hover:text-panel-text",
                    on ? "border-panel-text bg-panel-hover" : "border-bone/14",
                  )}
                >
                  <span className="font-mono text-[9.5px]">{d === today ? "HOY" : DOW[p.dow]}</span>
                  <span className="font-display text-xl leading-[1.1] font-semibold">{p.day}</span>
                  <span className={cx("text-[10.5px]", hasPend ? "text-sumeria-light" : "text-panel-muted")}>{n ? `${n} res.` : "—"}</span>
                </Link>
              );
            })}
          </div>
          <span className="font-mono text-[11px] text-panel-muted">
            Turno único · {TURN.range}
          </span>
          <span className="ml-auto text-[13px] text-panel-muted">
            {active.length} reservas · {active.reduce((x, r) => x + r.people, 0)} personas · {active.filter((r) => r.status === "pend").length} pendientes
          </span>
        </div>
      </div>

      {view === "list" ? (
        <div className="px-5 pt-5 pb-12 md:px-8">
          {rows.length === 0 ? (
            <div className="flex flex-col items-center gap-2.5 rounded-md border border-dashed border-bone/16 px-6 py-14 text-center">
              <XMark size={28} stroke={3.6} className="text-stone-6" />
              <span className="text-[15px] font-semibold">Sin reservas para este día</span>
              <span className="text-[13.5px] text-panel-muted">Si te reservaron por teléfono o WhatsApp, cargala a mano.</span>
              <div className="mt-1.5">
                <NewReservationButton days={days} date={date} variant="outline" />
              </div>
            </div>
          ) : (
            <Card className="overflow-x-auto">
              <div role="table" aria-label="Reservas del día">
                <div role="row" className="grid min-w-[900px] grid-cols-[56px_minmax(150px,1.4fr)_50px_130px_84px_120px_minmax(240px,1.6fr)] gap-3 border-b border-bone/8 px-[18px] py-2.5 font-mono text-[10.5px] text-panel-muted uppercase">
                  {["Hora", "Cliente", "Pers.", "Mesa", "Origen", "Estado", "Acciones"].map((h) => (
                    <span key={h} role="columnheader">
                      {h}
                    </span>
                  ))}
                </div>
                {rows.map((r) => (
                  <div
                    key={r.id}
                    role="row"
                    className={cx(
                      "grid min-w-[900px] grid-cols-[56px_minmax(150px,1.4fr)_50px_130px_84px_120px_minmax(240px,1.6fr)] items-center gap-3 border-b border-bone/6 px-[18px] py-3 last:border-b-0",
                      r.status === "canc" && "opacity-55",
                    )}
                  >
                    <span className="font-display text-lg">{r.time}</span>
                    <div className="flex min-w-0 flex-col gap-0.5">
                      <span className={cx("text-sm font-semibold", r.status === "canc" && "line-through")}>{r.name}</span>
                      <span className="text-xs text-panel-muted">{r.phone}</span>
                      {r.note && <span className="text-xs text-kraft">“{r.note}”</span>}
                    </div>
                    <span className="text-sm">{r.people}</span>
                    {r.tables.length > 1 ? (
                      <span className="flex flex-col gap-0.5 text-[13px]">
                        <span className="font-semibold">{tablesLabel(r.tables)}</span>
                        <span className="font-mono text-[10px] text-panel-muted uppercase">Combinadas</span>
                      </span>
                    ) : (
                      <select
                        value={r.tableN}
                        disabled={r.status === "canc" || a.pending}
                        aria-label={`Mesa de ${r.name}`}
                        onChange={(e) => a.move(r, Number(e.target.value))}
                        className="h-[34px] rounded border border-bone/16 bg-panel-bg px-2 text-[13px] text-panel-text"
                      >
                        {tableOptions(r).map((o) => (
                          <option key={o.n} value={o.n} disabled={o.busy}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                    )}
                    <span className="text-[12.5px] text-sand">{SOURCE_LABEL[r.source]}</span>
                    <span className="flex flex-col items-start gap-1">
                      <StatusTag status={r.status} />
                      {r.arrived && <span className="font-mono text-[10px] text-panel-muted uppercase">Llegaron</span>}
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {r.status === "pend" && (
                        <>
                          <AButton variant="primary" size="sm" disabled={a.pending} onClick={() => a.confirm(r)}>
                            Confirmar por WhatsApp
                          </AButton>
                          <AButton size="xs" disabled={a.pending} onClick={() => a.reject(r)}>
                            Rechazar
                          </AButton>
                        </>
                      )}
                      {r.status === "conf" && (
                        <>
                          <AButton size="xs" disabled={a.pending} onClick={() => a.cancel(r)}>
                            Cancelar
                          </AButton>
                          {!r.arrived && (
                            <AButton size="xs" disabled={a.pending} onClick={() => a.seat(r)}>
                              Llegaron
                            </AButton>
                          )}
                        </>
                      )}
                      {r.status === "canc" && (
                        <AButton variant="link" disabled={a.pending} onClick={() => a.restore(r)} className="h-[30px] px-1 text-[12.5px]">
                          Restaurar
                        </AButton>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      ) : (
        <div className="flex flex-wrap items-start gap-5 px-5 pt-5 pb-12 md:px-8">
          <div className="flex min-w-0 flex-[1_1_600px] flex-col gap-2.5">
            <FloorPlan fixtures={plan.fixtures} tables={planTablesList} fixtureTone="panel" className="rounded-xs border-bone/35 bg-ink! bg-[radial-gradient(rgba(244,241,236,.07)_1px,transparent_1px)]!" />
            <div className="flex flex-wrap gap-4">
              {(
                [
                  ["free", "Libre"],
                  ["pend", "Pendiente"],
                  ["conf", "Confirmada"],
                  ["occ", "Ocupada sin reserva"],
                ] as const
              ).map(([k, label]) => (
                <div key={k} className="flex items-center gap-2">
                  <span className={cx("h-[18px] w-[26px] rounded", PANEL_TABLE[k])} />
                  <span className="text-[12.5px] text-sand">{label}</span>
                </div>
              ))}
            </div>
          </div>
          <Card className="flex min-w-[280px] flex-[0_1_320px] flex-col gap-3 p-[18px]">
            {!selT ? (
              <>
                <span className="text-[15px] font-semibold">Tocá una mesa</span>
                <span className="text-[13.5px] leading-normal text-panel-muted">
                  Para ver la reserva, confirmarla, cambiarla o marcar la mesa como ocupada por gente que llegó sin reserva.
                </span>
              </>
            ) : (
              <>
                <div className="flex items-baseline justify-between">
                  <span className="font-display text-[28px] font-semibold uppercase">Mesa {selT.n}</span>
                  <span className="text-[13px] text-panel-muted">{selT.capacity} lugares</span>
                </div>
                <div>
                  <StatusTag status={selR ? selR.status : "free"} />
                </div>
                {selR && selR.status !== "occ" && (
                  <>
                    <dl className="m-0 grid grid-cols-[auto_1fr] gap-x-3.5 gap-y-1.5 text-sm">
                      {selR.tables.length > 1 && (
                        <>
                          <dt className="text-panel-muted">Mesas</dt>
                          <dd className="m-0">{selR.tables.join(" + ")} (combinadas)</dd>
                        </>
                      )}
                      <dt className="text-panel-muted">Cliente</dt>
                      <dd className="m-0">{selR.name}</dd>
                      <dt className="text-panel-muted">Hora</dt>
                      <dd className="m-0">{selR.time}</dd>
                      <dt className="text-panel-muted">Personas</dt>
                      <dd className="m-0">{selR.people}</dd>
                      <dt className="text-panel-muted">Teléfono</dt>
                      <dd className="m-0">{selR.phone}</dd>
                      {selR.note && (
                        <>
                          <dt className="text-panel-muted">Nota</dt>
                          <dd className="m-0 text-kraft">{selR.note}</dd>
                        </>
                      )}
                    </dl>
                    {selR.status === "pend" && (
                      <>
                        <AButton variant="primary" disabled={a.pending} onClick={() => a.confirm(selR)}>
                          Confirmar por WhatsApp
                        </AButton>
                        <AButton disabled={a.pending} onClick={() => a.reject(selR)}>
                          Rechazar
                        </AButton>
                      </>
                    )}
                    {selR.status === "conf" && (
                      <>
                        {!selR.arrived && (
                          <AButton disabled={a.pending} onClick={() => a.seat(selR)}>
                            Llegaron · marcar ocupada
                          </AButton>
                        )}
                        <AButton disabled={a.pending} onClick={() => a.cancel(selR)}>
                          Cancelar reserva
                        </AButton>
                      </>
                    )}
                  </>
                )}
                {!selR && (
                  <>
                    <span className="text-[13.5px] text-panel-muted">Libre este día.</span>
                    <AButton variant="light" disabled={a.pending} onClick={() => a.walkin(date, selT.n, true)}>
                      Marcar ocupada (sin reserva)
                    </AButton>
                    <AButton disabled={a.pending} onClick={() => setNewAt(selT.n)}>
                      Cargar reserva en esta mesa
                    </AButton>
                  </>
                )}
                {selR?.status === "occ" && (
                  <>
                    <span className="text-[13.5px] text-panel-muted">Ocupada por gente sin reserva. Queda bloqueada en el sitio.</span>
                    <AButton disabled={a.pending} onClick={() => a.walkin(date, selT.n, false)}>
                      Liberar mesa
                    </AButton>
                  </>
                )}
              </>
            )}
          </Card>
          <NewReservationDrawer open={newAt != null} onClose={() => setNewAt(null)} days={days} initial={{ date, tableN: newAt ?? undefined }} />
        </div>
      )}
    </>
  );
}

