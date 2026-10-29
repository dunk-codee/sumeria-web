"use client";

import { stagger, useAnimate, useInView, useReducedMotion } from "framer-motion";
import { useEffect, type ReactNode } from "react";

const EASE_OUT = [0.2, 0.7, 0.2, 1] as const;

/**
 * Aparición de "¿Qué pedimos hoy?" al entrar en pantalla: sube el encabezado (`data-reveal`) y después las tarjetas
 * (`data-rail-item`), escalonadas. El borde derecho de la tira (`data-rail`) se desvanece hasta llegar al final
 * (`data-end`), para que en mobile se note que hay más a la derecha.
 * Los elementos arrancan con `opacity-0` en el HTML (con `motion-reduce:opacity-100!` para quien pide menos movimiento).
 */
export function FeaturedReveal({ children }: { children: ReactNode }) {
  const [scope, animate] = useAnimate<HTMLDivElement>();
  const inView = useInView(scope, { once: true, amount: 0.3 });
  const reduce = useReducedMotion();

  // Desvanecido del borde derecho: se apaga al llegar al final de la tira.
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
  }, [scope]);

  useEffect(() => {
    if (!inView) return;
    const root = scope.current;
    const head = root.querySelectorAll("[data-reveal]");
    const items = root.querySelectorAll("[data-rail-item]");
    if (reduce) {
      animate([...head, ...items], { opacity: 1 }, { duration: 0 });
      return;
    }
    animate(head, { opacity: [0, 1], y: [20, 0] }, { duration: 0.55, ease: EASE_OUT, delay: stagger(0.08) });
    animate(items, { opacity: [0, 1], y: [32, 0] }, { duration: 0.6, ease: EASE_OUT, delay: stagger(0.08, { startDelay: 0.15 }) });
  }, [inView, reduce, animate, scope]);

  return <div ref={scope}>{children}</div>;
}
