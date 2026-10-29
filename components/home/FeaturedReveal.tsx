"use client";

import { stagger, useAnimate, useInView, useReducedMotion } from "framer-motion";
import { useEffect, type ReactNode } from "react";

const EASE_OUT = [0.2, 0.7, 0.2, 1] as const;

/**
 * Aparición de "¿Qué pedimos hoy?" al entrar en pantalla: sube el encabezado (`data-reveal`) y después las tarjetas
 * (`data-rail-item`), escalonadas. En mobile, si la tira (`data-rail`) se puede scrollear, las tarjetas hacen un amague
 * hacia la izquierda y vuelven, para que se note que hay más a la derecha. El borde derecho de la tira se desvanece
 * hasta llegar al final (`data-end`).
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
    const rail = root.querySelector<HTMLElement>("[data-rail]");
    if (reduce) {
      animate([...head, ...items], { opacity: 1 }, { duration: 0 });
      return;
    }
    let cancelled = false;
    // Si la persona ya está deslizando, no se interrumpe con el amague.
    let touched = false;
    const onTouch = () => {
      touched = true;
    };
    rail?.addEventListener("pointerdown", onTouch, { once: true });

    (async () => {
      animate(head, { opacity: [0, 1], y: [20, 0] }, { duration: 0.55, ease: EASE_OUT, delay: stagger(0.08) });
      await animate(items, { opacity: [0, 1], y: [32, 0] }, { duration: 0.6, ease: EASE_OUT, delay: stagger(0.08, { startDelay: 0.15 }) });
      const canScroll = rail && rail.scrollWidth > rail.clientWidth && rail.scrollLeft === 0;
      if (cancelled || touched || !canScroll || !window.matchMedia("(max-width: 899px)").matches) return;
      await animate(items, { x: [0, -56, 0] }, { duration: 1.2, ease: [0.45, 0, 0.25, 1], times: [0, 0.4, 1], delay: 0.25 });
    })();

    return () => {
      cancelled = true;
      rail?.removeEventListener("pointerdown", onTouch);
    };
  }, [inView, reduce, animate, scope]);

  return <div ref={scope}>{children}</div>;
}
