"use client";

import { button } from "@/components/ui";
import { XMark } from "@/components/XMark";
import { DEFAULT_SETTINGS } from "@/lib/defaults";
import { waLink } from "@/lib/whatsapp";

/** Estado "error": reintentar o pedir directo por WhatsApp. */
export default function CartaError({ retry }: { error: Error; retry: () => void }) {
  return (
    <div className="mx-auto flex max-w-140 flex-col items-center gap-4 px-6 pt-20 pb-35 text-center">
      <XMark size={48} stroke={3.6} className="text-sumeria" />
      <h2 className="m-0 font-display text-4xl leading-none font-semibold uppercase">No pudimos cargar la carta</h2>
      <p className="m-0 text-base leading-[1.55] text-stone-2">Revisá tu conexión y probá de nuevo. Si sigue sin andar, pedí directo por WhatsApp.</p>
      <div className="mt-2 flex flex-wrap justify-center gap-2.5">
        <button type="button" onClick={() => retry()} className={button({ variant: "outline", size: "md" })}>
          Reintentar
        </button>
        <a href={waLink(DEFAULT_SETTINGS.whatsapp)} target="_blank" rel="noopener noreferrer" className={button({ variant: "primary", size: "md" })}>
          Pedir por WhatsApp
        </a>
      </div>
    </div>
  );
}
