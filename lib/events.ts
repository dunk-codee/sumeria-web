import { DOW, MON, parts } from "./dates";
import type { PublicEvent } from "./data";

/** Destino del botón de un evento. */
export function ctaHref(target: string, instagram: string): { href: string; external: boolean } {
  if (target === "ig") return { href: `https://instagram.com/${instagram}`, external: true };
  if (target === "reserva") return { href: "/reservas", external: false };
  if (target.startsWith("cat:")) return { href: `/carta#cat-${target.slice(4)}`, external: false };
  return { href: "/carta", external: false };
}

export function eventDateParts(e: PublicEvent) {
  const iso = eventDisplayDate(e);
  const p = parts(iso);
  return { day: String(p.day).padStart(2, "0"), mon: MON[p.month].toUpperCase(), dow: DOW[p.dow], iso };
}

/** Evento destacado del inicio: el próximo sorteo o evento; si no hay, el primero. */
export function featuredEvent(list: PublicEvent[]): PublicEvent | undefined {
  return list.find((e) => e.type === "sorteo" || e.type === "evento") ?? list[0];
}

/** Fecha visible de la tarjeta: la destacada o, si falta, el vencimiento (publicación en novedades). */
export function eventDisplayDate(e: Pick<PublicEvent, "type" | "eventDate" | "publishedAt" | "expiresAt">): string {
  return e.eventDate ?? (e.type === "novedad" ? e.publishedAt : e.expiresAt);
}
