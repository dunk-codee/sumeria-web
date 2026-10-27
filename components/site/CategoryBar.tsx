"use client";

import { useEffect, useRef, useState } from "react";
import { cx } from "@/lib/format";
import { RedX } from "../XMark";

const OFFSET = 112; // header (56) + barra de categorías (52) + aire

/** Chips de categoría sticky: resaltan al scrollear y hacen scroll suave al tocarlos. */
export function CategoryBar({ cats }: { cats: { slug: string; name: string }[] }) {
  const [active, setActive] = useState(cats[0]?.slug);
  const barRef = useRef<HTMLDivElement>(null);
  const lock = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      if (Date.now() < lock.current) return;
      let cur = cats[0]?.slug;
      for (const c of cats) {
        const el = document.getElementById(`cat-${c.slug}`);
        if (el && el.getBoundingClientRect().top <= OFFSET + 18) cur = c.slug;
      }
      setActive(cur);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    // Deep link /carta#cat-bagels
    const hash = decodeURIComponent(location.hash.slice(1));
    if (hash.startsWith("cat-")) requestAnimationFrame(() => go(hash.slice(4), "instant"));
    return () => window.removeEventListener("scroll", onScroll);
  }, [cats]);

  // Mantiene visible el chip activo.
  useEffect(() => {
    const chip = barRef.current?.querySelector<HTMLElement>(`[data-cat="${active}"]`);
    chip?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [active]);

  function go(slug: string, behavior: ScrollBehavior = "smooth") {
    const el = document.getElementById(`cat-${slug}`);
    if (!el) return;
    lock.current = Date.now() + 700;
    setActive(slug);
    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - OFFSET, behavior });
    history.replaceState(null, "", `#cat-${slug}`);
  }

  return (
    <div className="sticky top-14 z-20 border-b border-bone/12 bg-ink/94 backdrop-blur-md">
      <nav ref={barRef} aria-label="Categorías" className="no-scrollbar mx-auto flex max-w-[1280px] gap-1 overflow-x-auto px-[clamp(12px,5vw,64px)]">
        {cats.map((c) => {
          const on = c.slug === active;
          return (
            <a
              key={c.slug}
              href={`#cat-${c.slug}`}
              data-cat={c.slug}
              aria-current={on ? "true" : undefined}
              onClick={(e) => {
                e.preventDefault();
                go(c.slug);
              }}
              className={cx(
                "flex h-[52px] flex-none items-center gap-2 px-3 font-display text-base font-medium tracking-[.1em] whitespace-nowrap uppercase hover:text-bone",
                on ? "text-bone" : "text-stone-5",
              )}
            >
              {on && <RedX size={11} stroke={4} />}
              <span>{c.name}</span>
            </a>
          );
        })}
      </nav>
    </div>
  );
}
