import type { Metadata } from "next";
import Link from "next/link";
import { InstagramIcon, WhatsAppIcon } from "@/components/icons";
import { button, Eyebrow, PageTitle } from "@/components/ui";
import { getSettings } from "@/lib/data";
import { WEEK_HOURS } from "@/lib/hours";
import { waDisplay, waLink } from "@/lib/whatsapp";

export const metadata: Metadata = {
  title: "Nosotros",
  description: "Dirección, horarios y contacto de Sumeria Sushi en Concepción del Uruguay.",
};

const cellLabel = "font-display text-[13px] tracking-[.24em] text-stone-3 uppercase";

export default async function NosotrosPage() {
  const s = await getSettings();
  const mapsQ = encodeURIComponent(`${s.address}, ${s.city}`);

  return (
    <section className="px-gutter pt-page pb-20">
      <div className="mx-auto flex max-w-[1280px] flex-col gap-[clamp(32px,4vw,56px)]">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,400px),1fr))] items-end gap-[clamp(24px,4vw,56px)]">
          <div className="flex flex-col gap-3.5">
            <Eyebrow>Nosotros</Eyebrow>
            <PageTitle>Sumeria</PageTitle>
            <p className="m-0 max-w-[50ch] text-[17px] leading-[1.6] text-pretty text-sand">
              Hacemos sushi en Concepción del Uruguay: arroz bien hecho, pescado fresco y cortes prolijos. Además de rolls y combinados, armamos
              bagels, ensaladas y hamburguesas de sushi. Vení a comer al salón, pasá a retirar o pedí delivery.
            </p>
          </div>
          <div
            className="aspect-[16/10] rounded-xs"
            aria-hidden
            style={{
              background:
                "repeating-linear-gradient(135deg,rgba(255,255,255,.025) 0 1px,transparent 1px 8px),radial-gradient(80% 70% at 40% 50%,rgba(150,92,48,.5) 0%,rgba(46,28,16,.85) 50%,#0a0807 90%)",
            }}
          />
        </div>

        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,280px),1fr))] gap-px border border-bone/12 bg-bone/12">
          <div className="flex flex-col gap-3 bg-ink p-6">
            <span className={cellLabel}>Dónde</span>
            <span className="font-display text-[28px] leading-[1.05] font-semibold uppercase">{s.address}</span>
            <span className="text-[15px] text-stone-2">{s.city}</span>
            <iframe
              title={`Mapa: ${s.address}`}
              src={`https://maps.google.com/maps?q=${mapsQ}&z=16&output=embed`}
              loading="lazy"
              className="aspect-[4/3] w-full rounded-xs border-0 grayscale-[.6] invert-[.9] hue-rotate-180"
            />
            <a href={`https://maps.google.com/?q=${mapsQ}`} target="_blank" rel="noopener noreferrer" className="font-display text-[15px] tracking-[.1em] uppercase underline">
              Cómo llegar
            </a>
          </div>
          <div className="flex flex-col gap-3.5 bg-ink p-6">
            <span className={cellLabel}>Horarios</span>
            <dl className="m-0 flex flex-col">
              {WEEK_HOURS.map((h) => (
                <div key={h.days} className="flex flex-col gap-0.5 border-b border-bone/10 py-2.5 first:pt-0 last:border-0">
                  <dt className="font-display text-[20px] font-semibold uppercase">{h.days}</dt>
                  <dd className="m-0 text-[15px] text-sand">
                    De {h.from} a {h.to}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="flex flex-col gap-3 bg-ink p-6">
            <span className={cellLabel}>Escribinos</span>
            <a
              href={waLink(s.whatsapp)}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`WhatsApp ${waDisplay(s.whatsapp)}`}
              className={button({ variant: "primary", size: "lg" })}
            >
              <WhatsAppIcon size={20} />
              {waDisplay(s.whatsapp)}
            </a>
            <a
              href={`https://instagram.com/${s.instagram}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Instagram @${s.instagram}`}
              className={button({ variant: "outline", size: "lg" })}
            >
              <InstagramIcon size={20} />
              @{s.instagram}
            </a>
            <Link href="/reservas" className={button({ variant: "text", size: "md" })}>
              Reservar mesa →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
