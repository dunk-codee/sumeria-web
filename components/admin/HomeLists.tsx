import Link from "next/link";
import type { AdminReservation } from "@/lib/admin-data";
import { cx, tablesLabel } from "@/lib/format";
import { ArrivedTag, Card, StatusTag } from "./ui";

export function HomeLists({ today }: { today: AdminReservation[] }) {
  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,380px),1fr))] items-start gap-4">
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
              </span>
            </div>
            <span className="flex flex-col items-end gap-1">
              <StatusTag status={r.status} />
              {r.arrived && <ArrivedTag />}
            </span>
          </div>
        ))}
      </Card>
    </div>
  );
}
