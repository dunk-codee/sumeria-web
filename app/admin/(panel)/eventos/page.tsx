import type { Metadata } from "next";
import { EventsEditor } from "@/components/admin/EventsEditor";
import { PageHead } from "@/components/admin/ui";
import { adminEvents, adminProducts, adminSettings } from "@/lib/admin-data";
import { requireAdmin } from "@/lib/auth";
import { todayISO } from "@/lib/dates";

export const metadata: Metadata = { title: "Eventos y promos" };

export default async function EventosAdmin({ searchParams }: PageProps<"/admin/eventos">) {
  await requireAdmin();
  const sp = await searchParams;
  const [events, { cats }, s] = await Promise.all([adminEvents(), adminProducts(), adminSettings()]);
  return (
    <>
      <PageHead kicker="Novedades" title="Eventos y promos" />
      <EventsEditor events={events} cats={cats} today={todayISO()} instagram={s.instagram} startNew={sp.nuevo === "1"} />
    </>
  );
}
