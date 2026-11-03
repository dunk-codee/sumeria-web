"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * Tira de "¿Qué pedimos hoy?": el borde derecho (`data-rail`) se desvanece hasta llegar al final (`data-end`),
 * para que en mobile se note que hay más a la derecha. Sin animación de aparición.
 */
export function FeaturedReveal({ children }: { children: ReactNode }) {
  const scope = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const rail = scope.current?.querySelector<HTMLElement>("[data-rail]");
    if (!rail) return;
    const update = () => {
      rail.dataset.end = String(rail.scrollLeft + rail.clientWidth >= rail.scrollWidth - 8);
    };
    update();
    rail.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      rail.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return <div ref={scope}>{children}</div>;
}
