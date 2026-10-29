import Link from "next/link";
import { FeaturedReveal } from "@/components/home/FeaturedReveal";
import { Hero } from "@/components/home/Hero";
import { Photo } from "@/components/Photo";
import { button, ButtonLink, Eyebrow, ExternalButton, SectionTitle, typeTag, TYPE_LABELS } from "@/components/ui";
import { getEvents, getMenu, getSettings } from "@/lib/data";
import { ctaHref, eventDateParts, featuredEvent } from "@/lib/events";
import { cx } from "@/lib/format";
import { hoursOf } from "@/lib/hours";
import { placeholderBg } from "@/lib/placeholders";
import { SLATE_CARD } from "@/components/site/slate";

/** Estado inicial de lo que aparece al scrollear (lo anima `FeaturedReveal`). */
const HIDDEN = "opacity-0 motion-reduce:opacity-100!";

export default async function HomePage() {
  const [menu, events, settings] = await Promise.all([getMenu(), getEvents(), getSettings()]);
  const salon = hoursOf(settings, "salon");
  const feat = featuredEvent(events);
  const stars = menu.filter((c) => c.featured && c.products.length > 0).slice(0, 6);
  const ig = `https://instagram.com/${settings.instagram}`;

  return (
    <>
      <Hero salonFrom={salon.from} address={settings.address} />

      {/* Lo que se viene */}
      {feat && (
        <section className="px-gutter pt-section">
          <div className="mx-auto flex max-w-7xl flex-col gap-[clamp(24px,3vw,36px)]">
            <Eyebrow>Lo que se viene</Eyebrow>
            <article className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,380px),1fr))] border border-bone/10 bg-coal">
              <Photo placeholder={feat.placeholder} publicId={feat.photoPublicId} url={feat.photoUrl} alt={feat.title} className="min-h-75" sizes="(max-width: 900px) 100vw, 640px" ratio={[16, 10]}>
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
          <FeaturedReveal>
            <div className="mx-auto flex max-w-7xl flex-col gap-[clamp(24px,3vw,36px)]">
              <div className="flex flex-wrap items-end justify-between gap-4 px-gutter">
                <div data-reveal className={cx("flex flex-col gap-2.5", HIDDEN)}>
                  <Eyebrow>Carta</Eyebrow>
                  <SectionTitle>¿Qué pedimos hoy?</SectionTitle>
                </div>
                <Link data-reveal href="/carta" className={cx(button({ variant: "text", size: "md" }), "px-0!", HIDDEN)}>
                  Carta completa →
                </Link>
              </div>
              {/* Mobile: las tarjetas encajan al deslizar y el borde derecho se desvanece hasta llegar al final (data-end). */}
              <div
                data-rail
                className="no-scrollbar grid snap-x snap-mandatory auto-cols-[72%] grid-flow-col justify-start gap-3 overflow-x-auto px-[14%] py-2 mask-[linear-gradient(to_right,#000_82%,transparent)] data-[end=true]:[mask-image:none] sm:auto-cols-[minmax(200px,1fr)] sm:justify-stretch sm:px-gutter d:snap-none d:mask-none"
              >
                {stars.map((c) => {
                  const p = c.products.find((x) => x.photoUrl || x.photoPublicId) ?? c.products[0];
                  return (
                    <Link
                      key={c.id}
                      data-rail-item
                      href={`/carta#cat-${c.slug}`}
                      className={cx(
                        "group relative block aspect-4/5 snap-center opacity-0 motion-reduce:opacity-100! outline-2 -outline-offset-2 outline-transparent transition-[outline-color] hover:outline-bone focus-visible:outline-bone",
                        SLATE_CARD,
                      )}
                    >
                      <Photo
                        placeholder={p.placeholder}
                        publicId={p.photoPublicId}
                        url={p.photoUrl}
                        cutout={p.photoCutout}
                        alt=""
                        bare
                        className="h-full w-full"
                        imgClassName={cx(
                          "transition-transform duration-500 group-hover:scale-105",
                          p.photoCutout && "p-[12%]! pt-[16%]! pb-[34%]!",
                        )}
                        sizes="280px"
                        ratio={[4, 5]}
                      />
                      <span aria-hidden className="absolute inset-x-0 bottom-0 h-[45%] bg-linear-to-t from-black/85 via-black/40 to-transparent" />
                      <span className="absolute inset-x-3 bottom-5 flex flex-col items-center justify-center gap-2.5 text-center font-display text-[clamp(22px,2vw,28px)] leading-none font-semibold text-balance text-bone uppercase">
                        {c.name}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </FeaturedReveal>
        </section>
      )}

      {/* Delivery & take away */}
      <section className="mt-[clamp(56px,7vw,112px)] bg-kraft-bag text-kraft-ink">
        <div className="mx-auto grid max-w-7xl grid-cols-[repeat(auto-fit,minmax(min(100%,360px),1fr))] items-center gap-[clamp(24px,4vw,56px)] px-gutter py-[clamp(40px,6vw,88px)]">
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
              className="aspect-3/4 rounded-xs"
              style={{
                background:
                  "repeating-linear-gradient(135deg,rgba(33,23,14,.06) 0 1px,transparent 1px 8px),radial-gradient(90% 80% at 50% 40%,#E3CCA6 0%,#A27A4C 70%,#6E4E2E 100%)",
              }}
            />
            <div
              className="mt-10 aspect-3/4 rounded-xs"
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
        <div className="mx-auto flex max-w-7xl flex-col gap-[clamp(24px,3vw,36px)]">
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
              className="rounded-xs border border-bone/35 px-4.5 py-3 font-display text-sm tracking-widest uppercase"
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
