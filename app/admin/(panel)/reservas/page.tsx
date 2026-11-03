import type { Metadata } from "next";
import { ReservationsBoard } from "@/components/admin/ReservationsBoard";
import { adminSettings, planTables, reservationsBetween } from "@/lib/admin-data";
import { requireAdmin } from "@/lib/auth";
import { addDays, isISODate, nextDays, todayISO } from "@/lib/dates";

export const metadata: Metadata = { title: "Reservas" };

export default async function ReservasAdmin({ searchParams }: PageProps<"/admin/reservas">) {
  await requireAdmin();
  const sp = await searchParams;
  const today = todayISO();
  const date = typeof sp.date === "string" && isISODate(sp.date) ? sp.date : today;
  // Ventana de 7 días que se ve en la tira: arranca en `desde` (por defecto hoy) y siempre incluye el día elegido.
  let from = typeof sp.desde === "string" && isISODate(sp.desde) ? sp.desde : today;
  if (date < from || date > addDays(from, 6)) from = date;
  const days = nextDays(from, 7);
  const view = sp.view === "plan" ? "plan" : "list";

  const [week, plan, s] = await Promise.all([reservationsBetween(days[0], days[6]), planTables(), adminSettings()]);

  return <ReservationsBoard date={date} view={view} days={days} today={today} week={week} plan={plan} address={s.address} hours={s.hours} />;
}
