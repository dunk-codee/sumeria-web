"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { cx } from "@/lib/format";
import { waLink } from "@/lib/whatsapp";
import { RedX } from "../XMark";
import { useSite } from "./SiteProvider";

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

  // Al navegar se cierran menú y carrito.
  useEffect(() => {
    toggleMenu(false);
    closeCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path]);

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b border-bone/10 bg-ink/90 px-gutter-sm backdrop-blur-md">
      <Link href="/" aria-label="Sumeria Sushi, inicio" className="flex h-11 items-center">
        <Image src="/brand/sumeria-logo.png" alt="Sumeria Sushi" width={1187} height={154} priority className="h-[19px] w-auto" />
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
                "flex h-11 items-center gap-2 font-display text-[15px] font-medium tracking-[.12em] uppercase hover:text-bone",
                active ? "text-bone" : "text-stone-3",
              )}
            >
              {active && <RedX size={10} stroke={4} />}
              <span>{n.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={openCart}
          aria-label={`Ver pedido, ${count} ${count === 1 ? "ítem" : "ítems"}`}
          className="flex h-10 items-center gap-2 rounded-xs border border-bone/30 px-3.5 font-display text-sm tracking-[.1em] uppercase hover:border-bone"
        >
          <span>Pedido</span>
          <span
            className={cx(
              "flex h-[22px] min-w-[22px] items-center justify-center rounded-full px-1.5 text-xs tracking-normal text-white",
              count ? "bg-sumeria-dark" : "bg-smoke-3",
            )}
          >
            {count}
          </span>
        </button>
        <button
          type="button"
          onClick={() => toggleMenu()}
          aria-expanded={menuOpen}
          aria-controls="menu-mobile"
          aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
          className="flex h-11 min-w-11 items-center justify-center font-display text-sm tracking-[.14em] d:hidden"
        >
          {menuOpen ? "CERRAR" : "MENÚ"}
        </button>
      </div>
    </header>
  );
}

export function MobileMenu({ whatsapp, instagram, address, salonFrom }: { whatsapp: string; instagram: string; address: string; salonFrom: string }) {
  const path = usePathname();
  const { menuOpen } = useSite();
  if (!menuOpen) return null;
  return (
    <div id="menu-mobile" className="fixed inset-x-0 top-14 bottom-0 z-[45] flex flex-col gap-7 overflow-y-auto bg-ink px-5 py-7 d:hidden">
      <nav className="flex flex-col" aria-label="Menú">
        {NAV.map((n) => {
          const active = isActive(path, n.href);
          return (
            <Link
              key={n.href}
              href={n.href}
              aria-current={active ? "page" : undefined}
              className={cx(
                "flex items-center gap-3.5 border-b border-bone/10 py-3 font-display text-[42px] leading-none font-semibold uppercase",
                active ? "text-bone" : "text-stone-3",
              )}
            >
              {active && <RedX size={18} stroke={4} />}
              {n.label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto flex flex-col gap-2.5">
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
      </div>
    </div>
  );
}
