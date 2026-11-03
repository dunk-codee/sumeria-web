import Link from "next/link";
import { FeaturedReveal } from "@/components/home/FeaturedReveal";
import { Hero } from "@/components/home/Hero";
import { Photo } from "@/components/Photo";
import { button, ButtonLink, Eyebrow, ExternalButton, SectionTitle, typeTag, TYPE_LABELS } from "@/components/ui";
import { getEvents, getMenu, getSettings } from "@/lib/data";
import { ctaHref, eventDateParts, featuredEvent } from "@/lib/events";
import { cx } from "@/lib/format";
import { openFromText } from "@/lib/hours";
import { SLATE_CARD } from "@/components/site/slate";
import { GOOGLE_REVIEWS } from "@/lib/reviews";
import { TURN } from "@/lib/turns";
import { waLink } from "@/lib/whatsapp";

/** Estrellas de una reseña: decorativas salvo que se pase `label`. */
function Stars({ count, label }: { count: number; label?: string }) {
  return (
    <span role={label ? "img" : undefined} aria-label={label} aria-hidden={label ? undefined : true} className="text-base tracking-widest text-sumeria">
      {"★".repeat(count)}
    </span>
  );
}

export default async function HomePage() {
  const [menu, events, settings] = await Promise.all([getMenu(), getEvents(), getSettings()]);
  const openText = openFromText(settings.hours);
  const feat = featuredEvent(events);
  const stars = menu.filter((c) => c.featured && c.products.length > 0).slice(0, 6);

  return (
    <>
      <Hero openText={openText} address={settings.address} />

      {/* Lo que se viene */}
      {feat && (
        <section className="bg-coal py-section">
          <div className="mx-auto flex max-w-7xl flex-col gap-[clamp(24px,3vw,36px)] px-gutter">
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
                <div className="flex flex-col gap-2.5">
                  <Eyebrow>Carta</Eyebrow>
                  <SectionTitle>¿Qué pedimos hoy?</SectionTitle>
                </div>
                <Link href="/carta" className={cx(button({ variant: "text", size: "md" }), "px-0!")}>
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
                      href={`/carta#cat-${c.slug}`}
                      className={cx(
                        "group relative block aspect-4/5 snap-center outline-2 -outline-offset-2 outline-transparent transition-[outline-color] hover:outline-bone focus-visible:outline-bone",
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
      <section className="mt-[clamp(56px,7vw,112px)] bg-coal">
        <div className="mx-auto grid max-w-7xl grid-cols-[repeat(auto-fit,minmax(min(100%,360px),1fr))] items-center gap-[clamp(32px,5vw,72px)] px-gutter py-[clamp(48px,7vw,112px)]">
          <div className="flex flex-col gap-5">
            <Eyebrow>Delivery &amp; take away</Eyebrow>
            <h2 className="m-0 font-display text-[clamp(44px,6vw,88px)] leading-[.95] font-semibold text-balance uppercase">
              Te lo llevamos o pasás a buscarlo
            </h2>
            <p className="m-0 max-w-[44ch] text-base leading-[1.55] text-pretty text-stone-2">
              Armá tu pedido acá y te llega por WhatsApp listo para confirmar. Sale en caja SUMERIA, como siempre.
            </p>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-6 gap-y-3">
              <ButtonLink href="/carta" variant="primary">
                Armá tu pedido <span aria-hidden>→</span>
              </ButtonLink>
              <ExternalButton href={waLink(settings.whatsapp)} variant="text" size="md">
                WhatsApp <span aria-hidden>→</span>
              </ExternalButton>
            </div>
            <dl className="m-0 mt-4 flex max-w-md border-t border-bone/12 pt-5">
              <div className="flex flex-1 flex-col gap-1.5 pr-6">
                <dt className="font-mono text-[11px] tracking-[.2em] text-stone-4 uppercase">Horario</dt>
                <dd className="m-0 text-[15px] text-bone">{openText}</dd>
              </div>
              <div className="flex flex-1 flex-col gap-1.5 border-l border-bone/12 pl-6">
                <dt className="font-mono text-[11px] tracking-[.2em] text-stone-4 uppercase">Retiro</dt>
                <dd className="m-0 text-[15px] text-bone">{settings.address}</dd>
              </div>
            </dl>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {[
              { kicker: "Te lo llevamos", title: "Delivery", offset: "" },
              { kicker: "Pasás a buscarlo", title: "Take away", offset: "mt-12 d:mt-20" },
            ].map((c) => (
              <div key={c.title} className={cx("relative flex aspect-3/4 flex-col items-center justify-end gap-2 px-3 pb-6 text-center", SLATE_CARD, c.offset)}>
                <span className="font-display text-xs tracking-[.28em] text-sumeria uppercase">{c.kicker}</span>
                <span className="font-display text-[clamp(26px,3vw,40px)] leading-none font-semibold text-bone uppercase">{c.title}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Reservas */}
      <section className="relative overflow-hidden py-section">
        <span
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-display text-[clamp(200px,38vw,560px)] leading-none font-bold text-transparent uppercase select-none [-webkit-text-stroke:1px_rgb(245_243_238/.07)]"
        >
          Mesa
        </span>
        <div className="relative mx-auto flex max-w-7xl flex-col items-center gap-5 px-gutter text-center">
          <div className="w-full text-left">
            <Eyebrow>Reservas</Eyebrow>
          </div>
          <h2 className="m-0 font-display text-[clamp(48px,8vw,112px)] leading-[.95] font-semibold text-balance uppercase">Reservá tu mesa</h2>
          <p className="m-0 max-w-[40ch] text-base leading-[1.55] text-pretty text-stone-2">
            Turno único de {TURN.range}. Tu mesa queda guardada durante todo el servicio.
          </p>
          <ButtonLink href="/reservas" variant="primary" className="mt-2">
            Reservar mesa <span aria-hidden>→</span>
          </ButtonLink>
        </div>
      </section>

      {/* Ustedes: reseñas de Google Maps */}
      <section className="bg-coal py-section">
        <div className="mx-auto flex max-w-7xl flex-col gap-[clamp(24px,3vw,36px)]">
          <div className="flex flex-wrap items-end justify-between gap-4 px-gutter">
            <div className="flex flex-col gap-4">
              <Eyebrow>Ustedes</Eyebrow>
              <SectionTitle>Así lo disfrutan</SectionTitle>
              <p className="m-0 flex flex-wrap items-center gap-x-2 text-[15px] leading-normal text-stone-2">
                <span className="font-display text-xl font-semibold text-bone">{String(GOOGLE_REVIEWS.rating).replace(".", ",")}</span>
                <Stars count={5} />
                <span>· {GOOGLE_REVIEWS.count} opiniones en Google</span>
              </p>
            </div>
            <ExternalButton href={GOOGLE_REVIEWS.mapsUrl} variant="text" size="md" className="px-0!">
              Ver todas en Google Maps <span aria-hidden>→</span>
            </ExternalButton>
          </div>
          {/* Carrusel: se desplaza solo y se frena al pasar el mouse o al enfocar; con `prefers-reduced-motion` se desliza con el dedo. */}
          <div className="group no-scrollbar overflow-x-auto mask-[linear-gradient(to_right,transparent,#000_6%,#000_94%,transparent)] motion-safe:overflow-hidden">
            <div className="flex w-max motion-safe:animate-marquee motion-safe:group-focus-within:[animation-play-state:paused] motion-safe:group-hover:[animation-play-state:paused]">
              {[0, 1].map((copy) => (
                <ul key={copy} aria-hidden={copy === 1 || undefined} className="m-0 flex shrink-0 list-none p-0">
                  {GOOGLE_REVIEWS.items.map((r) => (
                    <li key={r.author} className="flex w-[300px] flex-col gap-4 border-l border-bone/15 px-8 sm:w-[380px]">
                      <span aria-hidden className="font-display text-7xl leading-[.6] font-semibold text-sumeria">“</span>
                      <blockquote className="m-0 text-[17px] leading-[1.55] text-pretty text-bone">{r.text}</blockquote>
                      <footer className="mt-auto flex flex-col gap-1 pt-2">
                        <span className="font-display text-base tracking-widest text-bone uppercase">{r.author}</span>
                        <Stars count={r.stars} label={`${r.stars} de 5 estrellas`} />
                      </footer>
                    </li>
                  ))}
                </ul>
              ))}
            </div>
          </div>
          <span className="px-gutter font-mono text-[10.5px] tracking-wider text-stone-4 uppercase">Reseñas de Google Maps</span>
        </div>
      </section>
    </>
  );
}
