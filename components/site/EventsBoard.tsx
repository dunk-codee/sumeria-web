"use client";

import { useState } from "react";
import type { PublicEvent } from "@/lib/data";
import { cx } from "@/lib/format";
import { button } from "../ui";
import { RedX, XMark } from "../XMark";

const FILTERS = [
  ["todo", "Todo"],
  ["evento", "Eventos"],
  ["promo", "Promos"],
  ["sorteo", "Sorteos"],
  ["novedad", "Novedades"],
] as const;

/** Filtros Todo/Eventos/Promos/Sorteos/Novedades sobre las tarjetas ya renderizadas en el servidor. */
export function EventsBoard({
  events,
  cards,
  instagram,
}: {
  events: Pick<PublicEvent, "id" | "type">[];
  cards: Record<number, React.ReactNode>;
  instagram: string;
}) {
  const [filter, setFilter] = useState<(typeof FILTERS)[number][0]>("todo");
  const list = events.filter((e) => filter === "todo" || e.type === filter);

  return (
    <>
      <div className="no-scrollbar flex gap-1.5 overflow-x-auto" role="tablist" aria-label="Filtrar novedades">
        {FILTERS.map(([id, label]) => {
          const on = filter === id;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => setFilter(id)}
              className={cx(
                "flex h-10 flex-none items-center gap-2 rounded-xs border px-3.5 font-display text-sm tracking-widest uppercase",
                on ? "border-bone text-bone" : "border-bone/22 text-stone-2",
              )}
            >
              {on && <RedX size={9} stroke={4} />}
              {label}
            </button>
          );
        })}
      </div>

      {list.length === 0 ? (
        <div className="relative flex flex-col items-center gap-3.5 border border-bone/10 bg-[#100E0C] bg-[repeating-linear-gradient(135deg,rgba(255,255,255,.02)_0_1px,transparent_1px_10px)] px-6 py-18 text-center">
          <XMark size={40} stroke={3.6} className="text-bone" />
          <h2 className="m-0 font-display text-[34px] leading-none font-semibold uppercase">No hay novedades por ahora</h2>
          <p className="m-0 max-w-[42ch] text-base leading-[1.55] text-stone-2">Seguinos en Instagram para enterarte primero de sorteos y promos.</p>
          <a href={`https://instagram.com/${instagram}`} target="_blank" rel="noopener noreferrer" className={cx(button({ variant: "outline", size: "md" }), "mt-1.5")}>
            @{instagram}
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,340px),1fr))] gap-4.5">
          {list.map((e) => (
            <div key={e.id} className="contents">
              {cards[e.id]}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
