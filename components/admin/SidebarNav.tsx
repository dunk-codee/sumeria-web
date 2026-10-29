"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/app/admin/actions";
import { cx } from "@/lib/format";
import { RedX } from "../XMark";

const NAV = [
  { href: "/admin", label: "Inicio" },
  { href: "/admin/reservas", label: "Reservas", badge: true },
  { href: "/admin/calendario", label: "Calendario de reservas" },
  { href: "/admin/productos", label: "Productos" },
  { href: "/admin/categorias", label: "Categorías" },
  { href: "/admin/eventos", label: "Eventos y promos" },
  { href: "/admin/plano", label: "Plano del local" },
  { href: "/admin/local", label: "Datos del local" },
] as const;

export function SidebarNav({ email, pending }: { email: string; pending: number }) {
  const path = usePathname();
  const active = (href: string) => (href === "/admin" ? path === "/admin" : path.startsWith(href));
  return (
    <aside className="flex flex-col border-b border-bone/8 bg-panel-surface md:w-59 md:flex-none md:border-r md:border-b-0">
      <div className="flex items-center justify-between gap-2 border-bone/8 px-5 pt-4 pb-3 md:flex-col md:items-start md:border-b md:pt-5.5 md:pb-4.5">
        <Link href="/admin" className="flex flex-col gap-2">
          <Image src="/brand/sumeria-logo.png" alt="Sumeria Sushi" width={1187} height={154} className="h-auto w-30 md:w-35" />
          <span className="hidden font-mono text-[10px] tracking-[.18em] text-panel-muted uppercase md:block">Panel</span>
        </Link>
        <form action={logout} className="md:hidden">
          <button type="submit" className="text-[13px] text-panel-muted underline">
            Salir
          </button>
        </form>
      </div>
      <nav className="no-scrollbar flex gap-0.5 overflow-x-auto px-2.5 pb-2 md:flex-1 md:flex-col md:overflow-y-auto md:py-3" aria-label="Panel">
        {NAV.map((n) => {
          const on = active(n.href);
          const badge = "badge" in n && pending > 0;
          return (
            <Link
              key={n.href}
              href={n.href}
              aria-current={on ? "page" : undefined}
              className={cx(
                "flex h-10 flex-none items-center gap-2.5 rounded px-3 text-sm font-medium whitespace-nowrap hover:bg-panel-hover hover:text-panel-text",
                on ? "bg-panel-hover text-panel-text" : "text-panel-soft",
              )}
            >
              <span className="hidden w-2.5 md:flex">{on && <RedX size={10} stroke={4} />}</span>
              <span className="md:flex-1">{n.label}</span>
              {badge && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-sumeria-dark px-1.5 text-[11px] font-bold text-white" aria-label={`${pending} pendientes`}>
                  {pending}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
      <div className="hidden flex-col gap-2.5 border-t border-bone/8 px-5 pt-3.5 pb-4.5 text-[13px] md:flex">
        <Link href="/" target="_blank" className="text-sand">
          Ver el sitio →
        </Link>
        <span className="truncate text-panel-muted">{email}</span>
        <form action={logout}>
          <button type="submit" className="text-panel-muted underline hover:text-panel-text">
            Cerrar sesión
          </button>
        </form>
      </div>
    </aside>
  );
}
