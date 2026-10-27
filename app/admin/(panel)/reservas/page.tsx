import type { Metadata } from "next";
import { ReservationsBoard } from "@/components/admin/ReservationsBoard";
import { adminSettings, planTables, reservationsBetween } from "@/lib/admin-data";
import { requireAdmin } from "@/lib/auth";
import { isISODate, nextDays, nowTime, todayISO } from "@/lib/dates";
import { currentTurn } from "@/lib/turns";

export const metadata: Metadata = { title: "Reservas" };

export default async function ReservasAdmin({ searchParams }: PageProps<"/admin/reservas">) {
  await requireAdmin();
  const sp = await searchParams;
  const today = todayISO();
  const days = nextDays(today, 7);
  const qDate = typeof sp.date === "string" && isISODate(sp.date) ? sp.date : today;
  // Si piden un día fuera de la semana, se agrega para poder verlo igual.
  const date = qDate;
  const allDays = days.includes(date) ? days : [...days, date].sort();
  const turn = sp.turn === "0" ? 0 : sp.turn === "1" ? 1 : currentTurn(nowTime());
  const view = sp.view === "plan" ? "plan" : "list";

  const [week, plan, s] = await Promise.all([reservationsBetween(allDays[0], allDays[allDays.length - 1]), planTables(), adminSettings()]);

  return <ReservationsBoard date={date} turn={turn} view={view} days={allDays} today={today} week={week} plan={plan} address={s.address} />;
}
