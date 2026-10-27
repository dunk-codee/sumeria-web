"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cx } from "@/lib/format";
import { waLink } from "@/lib/whatsapp";
import { LOGO_X, X_PATHS } from "../XMark";
import { useSite } from "./SiteProvider";

const EASE_STROKE = [0.6, 0, 0.2, 1] as const;
const EASE_WIPE = [0.7, 0, 0.3, 1] as const;

/*
 * Logo del header: X en SVG (para dibujarla y girarla) + "SUMERIA SU SHI" recortado del PNG
 * (x 150–1187 de 1187 px, la X del PNG queda afuera). 19 px de alto → 18,4 + 127,9 px de ancho.
 */
function HeaderLogo() {
  const reduce = useReducedMotion();
  const draw = (delay: number, duration: number, ease: typeof EASE_STROKE | "easeOut") => ({
    initial: reduce ? false : { pathLength: 0, opacity: 0 },
    animate: { pathLength: 1, opacity: 1 },
    transition: { pathLength: { delay, duration, ease }, opacity: { delay, duration: 0.01 } },
  });
  return (
    <motion.span className="flex h-[19px] items-center" exit={{ opacity: 0, transition: { duration: 0.15 } }}>
      {/* Al pasar el mouse la X gira 180° y frena, como el loader. */}
      <svg
        viewBox="0 0 420 434"
        fill="none"
        stroke="currentColor"
        strokeWidth={74}
        strokeLinecap="round"
        aria-hidden
        className="h-[19px] w-[18.4px] shrink-0 overflow-visible text-sumeria transition-transform duration-700 ease-[cubic-bezier(.6,0,.3,1)] group-hover:rotate-180 group-focus-visible:rotate-180 motion-reduce:transition-none"
      >
        <motion.path d={LOGO_X.long} {...draw(0, 0.45, EASE_STROKE)} />
        <motion.path d={LOGO_X.top} {...draw(0.4, 0.2, "easeOut")} />
        <motion.path d={LOGO_X.bottom} {...draw(0.5, 0.2, "easeOut")} />
      </svg>
      <motion.span
        className="relative block aspect-[1037/154] h-full overflow-hidden"
        initial={reduce ? false : { clipPath: "inset(0 100% 0 0)" }}
        animate={{ clipPath: "inset(0 0% 0 0)" }}
        transition={{ delay: 0.3, duration: 0.55, ease: EASE_WIPE }}
      >
        <Image src="/brand/sumeria-logo.png" alt="" width={1187} height={154} priority className="absolute top-0 left-[-14.465%] h-full w-auto max-w-none" />
      </motion.span>
    </motion.span>
  );
}

/**
 * En el inicio el logo grande del hero ya está a la vista: el del header aparece recién cuando el del hero
 * se va por arriba (detrás del header). En el resto de las páginas se ve siempre.
 */
function useLogoVisible(path: string) {
  const [pastHero, setPastHero] = useState(false);
  useEffect(() => {
    if (path !== "/") return;
    const hero = document.querySelector("[data-hero-logo]");
    if (!hero) return;
    const io = new IntersectionObserver(([e]) => setPastHero(!e.isIntersecting), { rootMargin: "-56px 0px 0px 0px" });
    io.observe(hero);
    return () => {
      io.disconnect();
      setPastHero(false);
    };
  }, [path]);
  return path !== "/" || pastHero;
}

/** Trazo largo primero y después los dos cortos, como en el hero: [delay, duración] por trazo. */
const X_DRAW = [
  [0.05, 0.3],
  [0.28, 0.14],
  [0.36, 0.14],
] as const;

/**
 * X roja de la sección activa: se dibuja trazo por trazo.
 * No ocupa lugar propio en el flujo (absoluta en desktop, hueco reservado en mobile): los textos nunca se mueven.
 */
function NavX({ size, className }: { size: number; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <span aria-hidden className={cx("flex shrink-0", className)}>
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={4} strokeLinecap="round" className="shrink-0 overflow-visible text-sumeria">
        {X_PATHS.map((d, i) => (
          // El trazo arranca invisible: con puntas redondeadas, un largo 0 dibujaría un punto.
          <motion.path
            key={d}
            d={d}
            initial={reduce ? false : { pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{
              pathLength: { delay: X_DRAW[i][0], duration: X_DRAW[i][1], ease: i === 0 ? EASE_STROKE : "easeOut" },
              opacity: { delay: X_DRAW[i][0], duration: 0.01 },
            }}
          />
        ))}
      </svg>
    </span>
  );
}

/**
 * Botón del pedido: "Pedido" en texto limpio + la cantidad dentro de un sello hanko (cuadradito rojo, apenas girado,
 * con el filete interior de los sellos japoneses). Cada vez que cambia la cantidad el sello "golpea": cae grande y
 * girado y se asienta con un rebote seco. Sin ítems, el sello queda como contorno punteado (todavía sin estampar).
 */
function CartButton({ count, onClick }: { count: number; onClick: () => void }) {
  const reduce = useReducedMotion();
  const seal = "flex h-[26px] min-w-[26px] items-center justify-center rounded-xs px-1 font-display text-[15px] leading-none font-semibold tracking-normal";
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Ver pedido, ${count} ${count === 1 ? "ítem" : "ítems"}`}
      className={cx(
        "group flex h-11 items-center gap-2.5 px-1.5 font-display text-sm tracking-[.14em] uppercase transition-colors hover:text-bone",
        count ? "text-bone" : "text-stone-2",
      )}
    >
      <span>Pedido</span>
      {/* Contenedor fijo: el sello se anima por encima sin mover el texto. */}
      <span className="flex h-[26px] min-w-[26px] items-center justify-center">
        <AnimatePresence initial={false} mode="popLayout">
          {count > 0 ? (
            <motion.span
              key={count}
              // La inclinación en reposo (y enderezarse al pasar el mouse) es CSS (`rotate`); motion suma el giro del golpe en `transform`.
              className={cx(seal, "-rotate-6 bg-sumeria-dark text-white ring-1 ring-white/35 ring-inset transition-[rotate] group-hover:rotate-0")}
              initial={reduce ? false : { scale: 1.8, rotate: -16, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.1 } }}
              transition={{ type: "spring", stiffness: 700, damping: 22, mass: 0.6 }}
            >
              {count}
            </motion.span>
          ) : (
            <motion.span
              key="vacio"
              className={cx(seal, "-rotate-6 border border-dashed border-stone-4 text-stone-4")}
              initial={reduce ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.1 } }}
            >
              0
            </motion.span>
          )}
        </AnimatePresence>
      </span>
    </button>
  );
}

/**
 * Ícono del menú mobile: dos trazos redondeados (largo arriba, corto abajo, alineados a la derecha)
 * que al abrir se cruzan en una X roja, con las mismas puntas redondeadas que la X de la marca.
 */
function MenuIcon({ open }: { open: boolean }) {
  const bar = cx("absolute right-0 h-[2px] rounded-full transition-colors duration-300", open ? "bg-sumeria" : "bg-bone");
  const spring = { type: "spring", stiffness: 420, damping: 28 } as const;
  return (
    <span aria-hidden className="relative block h-3.5 w-[22px]">
      <motion.span className={cx(bar, "top-0 w-[22px]")} initial={false} animate={open ? { y: 6, rotate: 45 } : { y: 0, rotate: 0 }} transition={spring} />
      <motion.span
        className={cx(bar, "bottom-0")}
        initial={false}
        animate={open ? { y: -6, rotate: -45, width: 22 } : { y: 0, rotate: 0, width: 14 }}
        transition={spring}
      />
    </span>
  );
}

const EASE_OUT = [0.2, 0.7, 0.2, 1] as const;

export const NAV = [
  { href: "/", label: "Inicio" },
  { href: "/carta", label: "Carta" },
  { href: "/novedades", label: "Novedades" },
  { href: "/reservas", label: "Reservas" },
  { href: "/nosotros", label: "Nosotros" },
] as const;

const isActive = (path: string, href: string) => (href === "/" ? path === "/" : path.startsWith(href));

export function SiteHeader() {
  const path = usePathname();
  const { count, openCart, menuOpen, toggleMenu, closeCart } = useSite();
  // Con el menú mobile abierto el hero queda tapado: el logo se muestra igual.
  const logoVisible = useLogoVisible(path) || menuOpen;

  // Al navegar se cierran menú y carrito.
  useEffect(() => {
    toggleMenu(false);
    closeCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path]);

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b border-bone/10 bg-ink/90 px-gutter-sm backdrop-blur-md">
      {/* El link conserva su ancho aunque el logo esté oculto, así la nav no se corre. */}
      <Link
        href="/"
        aria-label="Sumeria Sushi, inicio"
        aria-hidden={logoVisible ? undefined : true}
        tabIndex={logoVisible ? undefined : -1}
        className={cx("group flex h-11 w-[146px] shrink-0 items-center", !logoVisible && "pointer-events-none")}
      >
        <AnimatePresence initial={false}>{logoVisible && <HeaderLogo key="logo" />}</AnimatePresence>
      </Link>

      <nav className="hidden items-center gap-[30px] d:flex" aria-label="Principal">
        {NAV.map((n) => {
          const active = isActive(path, n.href);
          return (
            <Link
              key={n.href}
              href={n.href}
              aria-current={active ? "page" : undefined}
              className={cx(
                "relative flex h-11 items-center font-display text-[15px] font-medium tracking-[.12em] uppercase hover:text-bone",
                active ? "text-bone" : "text-stone-3",
              )}
            >
              {/* A la izquierda del texto, dentro del espacio entre secciones (30 px). */}
              {active && <NavX size={10} className="absolute top-1/2 right-full mr-2 -translate-y-1/2" />}
              <span>{n.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="flex items-center gap-2">
        <CartButton count={count} onClick={openCart} />
        <button
          type="button"
          onClick={() => toggleMenu()}
          aria-expanded={menuOpen}
          aria-controls="menu-mobile"
          aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
          className="flex h-11 w-11 items-center justify-center d:hidden"
        >
          <MenuIcon open={menuOpen} />
        </button>
      </div>
    </header>
  );
}

export function MobileMenu({ whatsapp, instagram, address, salonFrom }: { whatsapp: string; instagram: string; address: string; salonFrom: string }) {
  const path = usePathname();
  const { menuOpen } = useSite();
  const reduce = useReducedMotion();
  // Al abrir: el panel baja como una cortina desde el header y las secciones suben escalonadas. Al cerrar: la cortina sube.
  const fadeUp = (delay: number) => ({
    initial: reduce ? false : { opacity: 0, y: 22 },
    animate: { opacity: 1, y: 0 },
    transition: { delay, duration: 0.45, ease: EASE_OUT },
  });
  return (
    <AnimatePresence>
      {menuOpen && (
        <motion.div
          id="menu-mobile"
          key="menu-mobile"
          className="fixed inset-x-0 top-14 bottom-0 z-[45] flex flex-col gap-7 overflow-y-auto bg-ink px-5 py-7 d:hidden"
          initial={reduce ? false : { clipPath: "inset(0 0 100% 0)" }}
          animate={{ clipPath: "inset(0 0 0% 0)" }}
          exit={reduce ? { opacity: 0, transition: { duration: 0 } } : { clipPath: "inset(0 0 100% 0)", transition: { duration: 0.3, ease: EASE_WIPE } }}
          transition={{ duration: 0.45, ease: EASE_WIPE }}
        >
          <nav className="flex flex-col" aria-label="Menú">
            {NAV.map((n, i) => {
              const active = isActive(path, n.href);
              return (
                <motion.div key={n.href} {...fadeUp(0.12 + i * 0.05)}>
                  <Link
                    href={n.href}
                    aria-current={active ? "page" : undefined}
                    className={cx(
                      "flex items-center gap-3.5 border-b border-bone/10 py-3 font-display text-[42px] leading-none font-semibold uppercase",
                      active ? "text-bone" : "text-stone-3",
                    )}
                  >
                    {/* Hueco reservado en todas las secciones: la X aparece sin correr el texto. */}
                    <span className="flex w-[18px] shrink-0">{active && <NavX size={18} />}</span>
                    {n.label}
                  </Link>
                </motion.div>
              );
            })}
          </nav>
          <motion.div {...fadeUp(0.4)} className="mt-auto flex flex-col gap-2.5">
            <span className="text-sm leading-relaxed text-stone-3">
              {address} · Todos los días desde las {salonFrom}
            </span>
            <a
              href={waLink(whatsapp)}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xs bg-sumeria-dark p-[15px] text-center font-display text-base font-semibold tracking-[.1em] text-white uppercase hover:bg-sumeria-deep hover:text-white"
            >
              WhatsApp
            </a>
            <a
              href={`https://instagram.com/${instagram}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xs border-[1.5px] border-bone p-[13.5px] text-center font-display text-base font-semibold tracking-[.1em] uppercase hover:bg-bone hover:text-ink"
            >
              @{instagram}
            </a>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
