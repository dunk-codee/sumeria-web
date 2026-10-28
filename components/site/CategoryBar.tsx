"use client";

import { motion, useReducedMotion } from "framer-motion";
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { cx } from "@/lib/format";
import { NavX } from "./NavX";

const HEADER = 56; // alto del header sticky

/** Categoría elegida en el filtro; `null` = todas. */
const FilterContext = createContext<string | null>(null);

/**
 * Carta filtrable: "Todas" muestra todas las categorías seguidas; al elegir una se ven solo sus productos.
 * Al tocar un filtro se vuelve al principio de la carta. La categoría queda en el hash (`/carta#cat-rolls`),
 * así los links del inicio y de las novedades abren la carta ya filtrada.
 */
export function CartaFilter({ cats, children }: { cats: { slug: string; name: string }[]; children: ReactNode }) {
  const [active, setActive] = useState<string | null>(null);
  const [stuck, setStuck] = useState(false);
  const topRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  // Deep link /carta#cat-bagels (al cargar y si cambia el hash estando en la carta).
  useEffect(() => {
    const fromHash = () => {
      const hash = decodeURIComponent(location.hash.slice(1));
      const slug = hash.startsWith("cat-") ? hash.slice(4) : null;
      setActive(slug && cats.some((c) => c.slug === slug) ? slug : null);
    };
    fromHash();
    window.addEventListener("hashchange", fromHash);
    return () => window.removeEventListener("hashchange", fromHash);
  }, [cats]);

  // La barra pegada al header lleva otro fondo y sombra, para que se note la división al scrollear.
  useEffect(() => {
    const el = topRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setStuck(!e.isIntersecting && e.boundingClientRect.top < HEADER), {
      rootMargin: `-${HEADER}px 0px 0px 0px`,
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Mantiene visible el chip activo. Solo scroll horizontal de la barra: `scrollIntoView` movería también la página.
  useEffect(() => {
    const bar = barRef.current;
    const chip = bar?.querySelector<HTMLElement>(`[data-cat="${active ?? ""}"]`);
    if (!bar || !chip) return;
    const left = chip.offsetLeft - bar.scrollLeft;
    if (left < 0 || left + chip.offsetWidth > bar.clientWidth) {
      bar.scrollTo({ left: chip.offsetLeft - (bar.clientWidth - chip.offsetWidth) / 2, behavior: "smooth" });
    }
  }, [active]);

  function choose(slug: string | null) {
    setActive(slug);
    history.replaceState(null, "", slug ? `#cat-${slug}` : location.pathname + location.search);
    // Al principio de la carta: la barra queda pegada al header y abajo arranca la lista.
    const top = topRef.current;
    if (top) {
      const y = top.getBoundingClientRect().top + window.scrollY - HEADER;
      if (window.scrollY > y) window.scrollTo({ top: y, behavior: "instant" });
    }
  }

  const options = [{ slug: null, name: "Todas" }, ...cats];

  return (
    <FilterContext value={active}>
      <div ref={topRef} aria-hidden />
      <div
        className={cx(
          "sticky top-14 z-20 border-b transition-[background-color,border-color,box-shadow] duration-300 backdrop-blur-md",
          stuck ? "border-bone/16 bg-coal/96 shadow-[0_12px_24px_-10px] shadow-black/80" : "border-bone/12 bg-ink/94",
        )}
      >
        <div ref={barRef} role="group" aria-label="Filtrar por categoría" className="no-scrollbar relative mx-auto flex max-w-[1280px] gap-1 overflow-x-auto px-[clamp(12px,5vw,64px)]">
          {options.map((c) => {
            const on = c.slug === active;
            return (
              <button
                key={c.slug ?? ""}
                type="button"
                data-cat={c.slug ?? ""}
                aria-pressed={on}
                onClick={() => choose(c.slug)}
                className={cx(
                  // Hueco fijo a la izquierda para la X: el texto no se mueve al activarse.
                  "relative flex h-[52px] flex-none items-center pr-3 pl-6 font-display text-base font-medium tracking-[.1em] whitespace-nowrap uppercase transition-colors hover:text-bone",
                  on ? "text-bone" : "text-stone-5",
                )}
              >
                {on && <NavX size={10} className="absolute top-1/2 left-2 -translate-y-1/2" />}
                <span>{c.name}</span>
              </button>
            );
          })}
        </div>
      </div>
      <motion.div
        key={active ?? ""}
        initial={reduce ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.2, 0, 0, 1] }}
      >
        {children}
      </motion.div>
    </FilterContext>
  );
}

/** Sección de una categoría: se oculta si hay otra elegida en el filtro. */
export function CartaSection({ slug, children }: { slug: string; children: ReactNode }) {
  const active = useContext(FilterContext);
  if (active && active !== slug) return null;
  return children;
}
