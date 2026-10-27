import Link from "next/link";
import { HomeLists } from "@/components/admin/HomeLists";
import { NewReservationButton } from "@/components/admin/reservations";
import { abtn } from "@/components/admin/styles";
import { PageHead } from "@/components/admin/ui";
import { adminProducts, adminSettings, pendingFrom, planTables, reservationsBetween } from "@/lib/admin-data";
import { requireAdmin } from "@/lib/auth";
import { longDate, nextDays, nowTime, todayISO } from "@/lib/dates";
import { cx } from "@/lib/format";

function greeting(time: string) {
  const h = Number(time.slice(0, 2));
  return h >= 5 && h < 13 ? "Buen día" : h >= 13 && h < 20 ? "Buenas tardes" : "Buenas noches";
}

export default async function AdminHome() {
  await requireAdmin();
  const today = todayISO();
  const time = nowTime();
  const [todayRes, pending, plan, { prods }, s] = await Promise.all([
    reservationsBetween(today, today),
    pendingFrom(today),
    planTables(),
    adminProducts(),
    adminSettings(),
  ]);
  const active = todayRes.filter((r) => r.status !== "canc" && r.status !== "occ");
  const busy = new Set(todayRes.filter((r) => r.status !== "canc").flatMap((r) => r.tables));
  const freeNow = plan.tables.filter((t) => !busy.has(t.n)).length;
  const paused = prods.filter((p) => !p.available).length;

  const stats = [
    { label: "Reservas de hoy", value: active.length, sub: `${active.reduce((a, r) => a + r.people, 0)} personas esperadas`, href: `/admin/reservas?date=${today}` },
    {
      label: "Pendientes por confirmar",
      value: pending.length,
      sub: pending.length ? "Confirmalas por WhatsApp" : "Todo al día",
      href: `/admin/reservas?date=${pending[0]?.date ?? today}`,
      alert: pending.length > 0,
    },
    { label: "Mesas libres ahora", value: `${freeNow} / ${plan.tables.length}`, sub: "Para el servicio de hoy", href: `/admin/reservas?date=${today}&view=plan` },
    { label: "Productos pausados", value: paused, sub: "Se ven como “no disponible hoy”", href: "/admin/productos?disp=off" },
  ];

  return (
    <>
      <PageHead kicker={`Hoy · ${longDate(today)}`} title={greeting(time)}>
        <NewReservationButton days={nextDays(today, 7)} date={today} />
        <Link href="/admin/productos/nuevo" className={abtn({ variant: "outline" })}>
          + Producto
        </Link>
        <Link href="/admin/eventos?nuevo=1" className={abtn({ variant: "outline" })}>
          + Promo o evento
        </Link>
      </PageHead>
      <div className="flex flex-col gap-6 px-5 pt-6 pb-12 md:px-8">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(190px,1fr))] gap-3">
          {stats.map((st) => (
            <Link
              key={st.label}
              href={st.href}
              className={cx("flex flex-col gap-1.5 rounded-md border bg-panel-surface p-[18px] hover:text-panel-text", st.alert ? "border-sumeria/50" : "border-bone/8 hover:border-bone/20")}
            >
              <span className="text-[13px] text-panel-muted">{st.label}</span>
              <span className={cx("font-display text-[40px] leading-none font-semibold", st.alert ? "text-sumeria-light" : "text-panel-text")}>{st.value}</span>
              <span className="text-[12.5px] text-panel-muted">{st.sub}</span>
            </Link>
          ))}
        </div>
        <HomeLists pending={pending} today={todayRes.filter((r) => r.status !== "occ")} address={s.address} todayISO={today} />
      </div>
    </>
  );
}
