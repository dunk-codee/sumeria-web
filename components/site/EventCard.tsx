import Link from "next/link";
import type { PublicEvent } from "@/lib/data";
import { ctaHref, eventDateParts } from "@/lib/events";
import { cx } from "@/lib/format";
import { Photo } from "../Photo";
import { typeTag, TYPE_LABELS } from "../ui";

const DATE_BLOCK: Record<PublicEvent["type"], string> = {
  evento: "bg-bone text-ink",
  promo: "bg-sumeria-dark text-white",
  sorteo: "bg-kraft text-kraft-ink",
  novedad: "border border-bone/30 bg-ink text-bone",
};

export function EventCard({ e, instagram, preview = false }: { e: PublicEvent; instagram: string; preview?: boolean }) {
  const d = eventDateParts(e);
  const cta = ctaHref(e.ctaTarget, instagram);
  const ctaCls = "mt-auto pt-2 font-display text-[15px] tracking-[.1em] text-bone uppercase hover:text-sumeria";
  const label = `${e.ctaLabel || "Ver más"} →`;
  return (
    <article className="flex flex-col overflow-hidden rounded-xs border border-bone/10 bg-coal">
      <Photo placeholder={e.placeholder} publicId={e.photoPublicId} url={e.photoUrl} alt={e.title} className="aspect-[16/10]" ratio={[16, 10]} sizes="(max-width: 900px) 100vw, 420px">
        <div className={cx("absolute top-0 left-0 px-3.5 pt-2.5 pb-3 text-center", DATE_BLOCK[e.type])}>
          <div className="font-display text-[46px] leading-[.9] font-semibold">{d.day}</div>
          <div className="mt-1 font-display text-[13px] tracking-[.2em]">{d.mon}</div>
        </div>
        <span className={cx(typeTag({ type: e.type }), "absolute top-3 right-3")}>{TYPE_LABELS[e.type]}</span>
        {e.type === "sorteo" && <span className="absolute bottom-0 left-5 font-script text-[76px] leading-none text-bone">Sorteo</span>}
      </Photo>
      <div className="flex flex-1 flex-col gap-2.5 p-5">
        {e.whenLabel && <span className="font-mono text-[11px] tracking-[.04em] text-stone-3 uppercase">{e.whenLabel}</span>}
        {e.type === "promo" ? (
          <h3 className="m-0 font-sans text-[27px] leading-[1.1] font-bold italic">{e.title || "Sin título"}</h3>
        ) : (
          <h3 className="m-0 font-display text-[27px] leading-[1.05] font-semibold uppercase">{e.title || "Sin título"}</h3>
        )}
        <p className="m-0 text-[15px] leading-[1.55] text-pretty text-stone-2">{e.description}</p>
        {preview ? (
          <span className={ctaCls}>{label}</span>
        ) : cta.external ? (
          <a href={cta.href} target="_blank" rel="noopener noreferrer" className={ctaCls}>
            {label}
          </a>
        ) : (
          <Link href={cta.href} className={ctaCls}>
            {label}
          </Link>
        )}
      </div>
    </article>
  );
}
