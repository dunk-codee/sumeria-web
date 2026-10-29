import type { Metadata } from "next";
import { Reservation } from "@/components/site/Reservation";
import { button, Eyebrow, PageTitle } from "@/components/ui";
import { XMark } from "@/components/XMark";
import { getPlan, getSettings } from "@/lib/data";
import { dbConfigured } from "@/lib/db";
import { waDisplay, waLink } from "@/lib/whatsapp";

export const metadata: Metadata = {
  title: "Reservas",
  description: "Elegí día y mesa en el plano del salón. Te confirmamos por WhatsApp.",
};

export default async function ReservasPage() {
  const [plan, settings] = await Promise.all([getPlan(), getSettings()]);
  return (
    <section className="px-gutter pt-page pb-30">
      <div className="mx-auto flex max-w-7xl flex-col gap-7">
        <div className="flex flex-col gap-3">
          <Eyebrow>Reservas</Eyebrow>
          <PageTitle>Reservá tu mesa</PageTitle>
        </div>
        {dbConfigured() ? (
          <Reservation plan={plan} whatsapp={settings.whatsapp} booking={settings.booking} />
        ) : (
          // Modo sin base: las reservas online se activan al conectar la base de datos.
          <div className="flex max-w-155 flex-col gap-4 rounded-xs border border-bone/14 bg-coal p-[clamp(22px,3vw,36px)]">
            <XMark size={36} stroke={3.6} className="text-sumeria" />
            <h2 className="m-0 font-display text-[clamp(28px,3vw,40px)] leading-none font-semibold uppercase">Reservá por WhatsApp</h2>
            <p className="m-0 text-base leading-[1.55] text-stone-2">
              Escribinos con el día y cuántos son, y te confirmamos la mesa por ahí.
            </p>
            <a
              href={waLink(settings.whatsapp, "¡Hola Sumeria! Quiero reservar una mesa.")}
              target="_blank"
              rel="noopener noreferrer"
              className={button({ variant: "primary" }) + " self-start"}
            >
              WhatsApp {waDisplay(settings.whatsapp)}
            </a>
          </div>
        )}
      </div>
    </section>
  );
}
