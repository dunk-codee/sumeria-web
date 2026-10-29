import type { Metadata } from "next";
import { EventCard } from "@/components/site/EventCard";
import { EventsBoard } from "@/components/site/EventsBoard";
import { Eyebrow, PageTitle } from "@/components/ui";
import { getEvents, getSettings } from "@/lib/data";

export const metadata: Metadata = {
  title: "Novedades",
  description: "Eventos, promos y sorteos de Sumeria Sushi.",
};

export default async function NovedadesPage() {
  const [events, settings] = await Promise.all([getEvents(), getSettings()]);
  const cards = Object.fromEntries(events.map((e) => [e.id, <EventCard key={e.id} e={e} instagram={settings.instagram} />]));

  return (
    <section className="px-gutter pt-page pb-30">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <div className="flex flex-col gap-3">
          <Eyebrow>Novedades</Eyebrow>
          <PageTitle>Eventos y promos</PageTitle>
          <p className="m-0 max-w-[52ch] text-base leading-normal text-stone-2">Lo que pasa en Sumeria esta semana y las que vienen.</p>
        </div>
        <EventsBoard events={events.map((e) => ({ id: e.id, type: e.type }))} cards={cards} instagram={settings.instagram} />
      </div>
    </section>
  );
}
