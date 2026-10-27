import type { Metadata } from "next";
import { Reservation } from "@/components/site/Reservation";
import { Eyebrow, PageTitle } from "@/components/ui";
import { getPlan, getSettings } from "@/lib/data";

export const metadata: Metadata = {
  title: "Reservas",
  description: "Elegí día, turno y mesa en el plano del salón. Te confirmamos por WhatsApp.",
};

export default async function ReservasPage() {
  const [plan, settings] = await Promise.all([getPlan(), getSettings()]);
  return (
    <section className="px-gutter pt-page pb-[120px]">
      <div className="mx-auto flex max-w-[1280px] flex-col gap-7">
        <div className="flex flex-col gap-3">
          <Eyebrow>Reservas</Eyebrow>
          <PageTitle>Reservá tu mesa</PageTitle>
        </div>
        <Reservation plan={plan} whatsapp={settings.whatsapp} />
      </div>
    </section>
  );
}
