"use client";

import Link from "next/link";
import type { AdminReservation } from "@/lib/admin-data";
import { dayMonth } from "@/lib/dates";
import { cx, tablesLabel } from "@/lib/format";
import { SOURCE_LABEL, useResActions } from "./reservations";
import { AButton, Card, StatusTag } from "./ui";

export function HomeLists({ pending, today, address, todayISO }: { pending: AdminReservation[]; today: AdminReservation[]; address: string; todayISO: string }) {
  const a = useResActions(address);
  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,380px),1fr))] items-start gap-4">
      <Card>
        <div className="flex items-center justify-between border-b border-bone/8 px-4.5 py-4">
          <h2 className="m-0 text-[15px] font-bold">Pendientes por confirmar</h2>
          {pending.length > 0 && <span className="font-mono text-[11px] text-sumeria-light">{pending.length} en total</span>}
        </div>
        {pending.length === 0 && <div className="px-4.5 py-7 text-center text-sm text-panel-muted">No hay reservas esperando confirmación.</div>}
        {pending.map((r) => (
          <div key={r.id} className="flex flex-wrap items-center gap-3.5 border-b border-bone/6 px-4.5 py-3.5 last:border-b-0">
            <div className="flex w-13.5 flex-none flex-col">
              <span className="font-display text-xl">{r.time}</span>
              {r.date !== todayISO && <span className="font-mono text-[10px] text-panel-muted uppercase">{dayMonth(r.date)}</span>}
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="text-sm font-semibold">{r.name}</span>
              <span className="text-[12.5px] text-panel-muted">
                {r.people} personas · {tablesLabel(r.tables)} · {SOURCE_LABEL[r.source]}
              </span>
            </div>
            <div className="flex gap-2">
              <AButton variant="primary" size="sm" disabled={a.pending} onClick={() => a.confirm(r)}>
                Confirmar
              </AButton>
              <AButton size="sm" disabled={a.pending} onClick={() => a.reject(r)}>
                Rechazar
              </AButton>
            </div>
          </div>
        ))}
      </Card>
      <Card>
        <div className="flex items-center justify-between border-b border-bone/8 px-4.5 py-4">
          <h2 className="m-0 text-[15px] font-bold">Reservas de hoy</h2>
          <Link href="/admin/reservas" className="text-[13px] text-panel-muted underline">
            Ver todas
          </Link>
        </div>
        {today.length === 0 && <div className="px-4.5 py-7 text-center text-sm text-panel-muted">Todavía no hay reservas para hoy.</div>}
        {today.map((r) => (
          <div key={r.id} className={cx("flex items-center gap-3.5 border-b border-bone/6 px-4.5 py-3 last:border-b-0", r.status === "canc" && "opacity-55")}>
            <div className="w-13.5 flex-none font-display text-lg">{r.time}</div>
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className={cx("text-sm font-semibold", r.status === "canc" && "line-through")}>{r.name}</span>
              <span className="text-[12.5px] text-panel-muted">
                {r.people} personas · {tablesLabel(r.tables)}
                {r.arrived && " · Llegaron"}
              </span>
            </div>
            <StatusTag status={r.status} />
          </div>
        ))}
      </Card>
    </div>
  );
}
