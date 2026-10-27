import Image from "next/image";
import Link from "next/link";
import { Photo } from "@/components/Photo";
import { button, ButtonLink, Eyebrow, ExternalButton, SectionTitle, typeTag, TYPE_LABELS } from "@/components/ui";
import { RedX } from "@/components/XMark";
import { getEvents, getMenu, getSettings } from "@/lib/data";
import { ctaHref, eventDateParts, featuredEvent } from "@/lib/events";
import { cx } from "@/lib/format";
import { hoursOf } from "@/lib/hours";
import { placeholderBg } from "@/lib/placeholders";

export default async function HomePage() {
  const [menu, events, settings] = await Promise.all([getMenu(), getEvents(), getSettings()]);
  const salon = hoursOf(settings, "salon");
  const feat = featuredEvent(events);
  const stars = menu.filter((c) => c.featured && c.products.length > 0).slice(0, 6);
  const ig = `https://instagram.com/${settings.instagram}`;

  return (
    <>
      {/* Hero */}
      <section className="relative flex h-[clamp(600px,56vw,800px)] items-end overflow-hidden">
        <Image
          src="/fotos/hero-sushi.jpg"
          alt="Rolls de salmón sobre plato negro y mesa de madera oscura"
          fill
          priority
          quality={85}
          sizes="100vw"
          className="object-cover object-[84%_50%] d:object-[60%_50%]"
        />
        {/* Degradés: legibilidad del logo (izquierda/abajo) y fundido con la página. */}
        <div className="absolute inset-0 hidden bg-[linear-gradient(90deg,rgba(11,10,9,.8)_0%,rgba(11,10,9,.35)_45%,rgba(11,10,9,0)_70%)] d:block" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(11,10,9,.35)_0%,rgba(11,10,9,0)_25%,rgba(11,10,9,.55)_60%,#0B0A09_100%)]" />
        <div className="relative mx-auto flex w-full max-w-[1280px] flex-col gap-[22px] px-gutter pb-[clamp(36px,5vw,80px)]">
          <div className="flex w-[min(100%,440px)] flex-col gap-4">
            <h1 className="m-0">
              <Image src="/brand/sumeria-logo.png" alt="Sumeria Sushi" width={1187} height={154} priority className="block h-auto w-full" />
            </h1>
            <div className="flex items-center gap-3">
              <span className="h-px flex-1 bg-bone/45" />
              <span className="font-display text-[clamp(12px,1.2vw,15px)] tracking-[.32em] whitespace-nowrap uppercase">Sushi · Rolls · Salads · Bagels</span>
              <span className="h-px flex-1 bg-bone/45" />
            </div>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <ButtonLink href="/carta" className="max-w-60 flex-[1_1_160px]">
              Ver la carta
            </ButtonLink>
            <ButtonLink href="/reservas" variant="outline" className="max-w-60 flex-[1_1_160px]">
              Reservar mesa
            </ButtonLink>
          </div>
        </div>
      </section>

      <div className="flex flex-wrap items-center justify-center gap-x-[22px] gap-y-2 border-y border-bone/12 px-5 py-[18px] text-center font-display text-[clamp(14px,1.3vw,17px)] tracking-[.12em] uppercase">
        <span>Todos los días desde las {salon.from}</span>
        <RedX size={9} stroke={4} />
        <span>Delivery &amp; take away</span>
        <RedX size={9} stroke={4} />
        <span>{settings.address}</span>
      </div>

      {/* Lo que se viene */}
      {feat && (
        <section className="px-gutter pt-section">
          <div className="mx-auto flex max-w-[1280px] flex-col gap-[22px]">
            <Eyebrow>Lo que se viene</Eyebrow>
            <article className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,380px),1fr))] border border-bone/10 bg-coal">
              <Photo placeholder={feat.placeholder} publicId={feat.photoPublicId} url={feat.photoUrl} alt={feat.title} className="min-h-[300px]" sizes="(max-width: 900px) 100vw, 640px" ratio={[16, 10]}>
                {feat.type === "sorteo" && (
                  <span className="absolute bottom-1 left-6 font-script text-[clamp(80px,9vw,120px)] leading-none text-bone">Sorteo</span>
                )}
              </Photo>
              <div className="flex flex-col gap-4 p-[clamp(24px,3.5vw,48px)]">
                {(() => {
                  const d = eventDateParts(feat);
                  return (
                    <div className="flex items-end gap-4">
                      <div className="font-display text-[clamp(72px,8vw,104px)] leading-[.82] font-semibold">{d.day}</div>
                      <div className="flex flex-col gap-1.5 pb-1">
                        <span className="font-display text-xl tracking-[.2em]">
                          {d.mon} · {d.dow}
                        </span>
                        <span className={cx(typeTag({ type: feat.type }), "self-start")}>{TYPE_LABELS[feat.type]}</span>
                      </div>
                    </div>
                  );
                })()}
                <h3
                  className={cx(
                    "m-0 text-[clamp(30px,3.2vw,44px)] leading-none text-balance",
                    feat.type === "promo" ? "font-sans font-bold italic" : "font-display font-semibold uppercase",
                  )}
                >
                  {feat.title}
                </h3>
                <p className="m-0 max-w-[46ch] text-base leading-[1.55] text-pretty text-stone-2">{feat.description}</p>
                <div className="mt-auto flex flex-wrap gap-2.5 pt-2">
                  {(() => {
                    const c = ctaHref(feat.ctaTarget, settings.instagram);
                    return c.external ? (
                      <ExternalButton href={c.href} variant="outline" size="md">
                        {feat.ctaLabel || "Ver más"}
                      </ExternalButton>
                    ) : (
                      <ButtonLink href={c.href} variant="outline" size="md">
                        {feat.ctaLabel || "Ver más"}
                      </ButtonLink>
                    );
                  })()}
                  <Link href="/novedades" className={button({ variant: "text", size: "md" })}>
                    Ver todas las novedades →
                  </Link>
                </div>
              </div>
            </article>
          </div>
        </section>
      )}

      {/* Categorías estrella */}
      {stars.length > 0 && (
        <section className="pt-section">
          <div className="mx-auto flex max-w-[1280px] flex-col gap-[22px]">
            <div className="flex flex-wrap items-end justify-between gap-4 px-gutter">
              <div className="flex flex-col gap-2.5">
                <Eyebrow>Carta</Eyebrow>
                <SectionTitle>¿Qué pedimos hoy?</SectionTitle>
              </div>
              <Link href="/carta" className={cx(button({ variant: "text", size: "md" }), "px-0!")}>
                Carta completa →
              </Link>
            </div>
            <div className="no-scrollbar grid auto-cols-[minmax(210px,1fr)] grid-flow-col gap-2.5 overflow-x-auto px-gutter pb-1.5">
              {stars.map((c) => {
                const p = c.products.find((x) => x.photoUrl || x.photoPublicId) ?? c.products[0];
                return (
                  <Link key={c.id} href={`/carta#cat-${c.slug}`} className="group relative block aspect-[3/4] overflow-hidden rounded-xs hover:outline hover:outline-bone">
                    <Photo
                      placeholder={p.placeholder}
                      publicId={p.photoPublicId}
                      url={p.photoUrl}
                      cutout={p.photoCutout}
                      alt=""
                      className="h-full w-full"
                      imgClassName="p-[14%]! pb-[28%]! transition-transform duration-500 group-hover:scale-105"
                      sizes="260px"
                      ratio={[3, 4]}
                    />
                    <span className="absolute inset-x-4 bottom-4 flex items-center gap-2.5 font-display text-[34px] leading-none font-semibold text-bone uppercase">
                      <RedX size={14} stroke={4} />
                      {c.name}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Delivery & take away */}
      <section className="mt-[clamp(56px,7vw,112px)] bg-kraft-bag text-kraft-ink">
        <div className="mx-auto grid max-w-[1280px] grid-cols-[repeat(auto-fit,minmax(min(100%,360px),1fr))] items-center gap-[clamp(24px,4vw,56px)] px-gutter py-[clamp(40px,6vw,88px)]">
          <div className="flex flex-col gap-4">
            <Eyebrow tone="kraft">Delivery &amp; take away</Eyebrow>
            <h2 className="m-0 font-display text-[clamp(38px,5vw,72px)] leading-[.95] font-semibold text-balance uppercase">Te lo llevamos o pasás a buscarlo</h2>
            <p className="m-0 max-w-[44ch] text-base leading-[1.55]">
              Armá tu pedido acá y te llega por WhatsApp listo para confirmar. Sale en caja SUMERIA, como siempre.
            </p>
            <ButtonLink href="/carta" variant="onKraft" className="mt-1.5 self-start">
              Armá tu pedido
            </ButtonLink>
          </div>
          <div className="grid grid-cols-2 gap-2.5" aria-hidden>
            <div
              className="aspect-[3/4] rounded-xs"
              style={{
                background:
                  "repeating-linear-gradient(135deg,rgba(33,23,14,.06) 0 1px,transparent 1px 8px),radial-gradient(90% 80% at 50% 40%,#E3CCA6 0%,#A27A4C 70%,#6E4E2E 100%)",
              }}
            />
            <div
              className="mt-10 aspect-[3/4] rounded-xs"
              style={{
                background:
                  "repeating-linear-gradient(135deg,rgba(255,255,255,.03) 0 1px,transparent 1px 8px),radial-gradient(80% 70% at 50% 45%,rgba(140,84,44,.6) 0%,#1A120C 80%)",
              }}
            />
          </div>
        </div>
      </section>

      {/* Ustedes */}
      <section className="px-gutter py-section">
        <div className="mx-auto flex max-w-[1280px] flex-col gap-[22px]">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="flex flex-col gap-2.5">
              <Eyebrow>Ustedes</Eyebrow>
              <SectionTitle>Así lo disfrutan</SectionTitle>
              <p className="m-0 max-w-[52ch] text-[15px] leading-normal text-stone-2">
                Las fotos que comparten en Instagram. Etiquetanos en{" "}
                <a href={ig} target="_blank" rel="noopener noreferrer" className="underline">
                  @{settings.instagram}
                </a>{" "}
                y aparecés acá.
              </p>
            </div>
            <a
              href={ig}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xs border border-bone/35 px-[18px] py-3 font-display text-sm tracking-[.1em] uppercase"
            >
              Ver el perfil
            </a>
          </div>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(max(100px,15%),1fr))] gap-1.5">
            {(["madera", "pizarra", "kraft", "negro", "makisu", "madera"] as const).map((ph, i) => (
              <a
                key={i}
                href={ig}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Foto ${i + 1} de clientes en Instagram`}
                className="block aspect-square rounded-xs"
                style={{ backgroundImage: placeholderBg(ph) }}
              />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
