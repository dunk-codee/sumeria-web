import { DOW_LONG, parts } from "./dates";
import { money, piecesLabel } from "./format";

export const waLink = (number: string, text?: string) =>
  `https://wa.me/${number.replace(/\D/g, "")}${text ? `?text=${encodeURIComponent(text)}` : ""}`;

/** "5493442535419" → "3442 15535419" (como se escribe en Argentina). */
export function waDisplay(number: string): string {
  const d = number.replace(/\D/g, "").replace(/^549/, "");
  if (d.length === 10) return `${d.slice(0, 4)} 15${d.slice(4)}`;
  return d;
}

/**
 * Teléfono cargado por el cliente ("3442 15 412233") → número internacional
 * para wa.me ("5493442412233"): se quita el 15 después del código de área.
 */
export function toWaNumber(phone: string): string {
  let d = phone.replace(/\D/g, "");
  d = d.replace(/^0/, "");
  if (d.startsWith("549")) return d;
  if (d.startsWith("54")) return "549" + d.slice(2);
  d = d.replace(/^(\d{4})15/, "$1").replace(/^(\d{3})15(\d{7})$/, "$1$2").replace(/^(\d{2})15(\d{8})$/, "$1$2");
  return "549" + d;
}

export type OrderLine = { name: string; pieces: string | null; price: number; qty: number; note: string };

export function orderMessage(o: {
  lines: OrderLine[];
  mode: "delivery" | "take";
  zone?: { name: string; price: number };
  name: string;
  address: string;
  note: string;
  pickupAddress: string;
}): string {
  const subtotal = o.lines.reduce((a, l) => a + l.qty * l.price, 0);
  const envio = o.mode === "delivery" && o.zone ? o.zone.price : 0;
  const out = ["¡Hola Sumeria! Quiero hacer este pedido:", ""];
  for (const l of o.lines) {
    const pcs = piecesLabel(l.pieces);
    out.push(`• ${l.qty} × ${l.name}${pcs ? ` (${pcs})` : ""} — ${money(l.qty * l.price)}`);
    if (l.note.trim()) out.push(`   Nota: ${l.note.trim()}`);
  }
  out.push("", `Subtotal: ${money(subtotal)}`);
  if (o.mode === "delivery" && o.zone) out.push(`Envío (${o.zone.name}): ${money(envio)}`);
  out.push(`Total: ${money(subtotal + envio)}`, "");
  out.push(`Entrega: ${o.mode === "delivery" ? "Delivery" : `Take away (retiro en ${o.pickupAddress})`}`);
  out.push(`Nombre: ${o.name.trim() || "—"}`);
  if (o.mode === "delivery") out.push(`Dirección: ${o.address.trim() || "—"}`);
  if (o.note.trim()) out.push(`Nota: ${o.note.trim()}`);
  return out.join("\n");
}

export function reservationConfirmMessage(r: {
  name: string;
  date: string;
  time: string;
  people: number;
  tableN: number;
  address: string;
}): string {
  const p = parts(r.date);
  const first = r.name.trim().split(/\s+/)[0] ?? r.name;
  return `¡Hola ${first}! Te confirmamos la reserva en Sumeria para el ${DOW_LONG[p.dow]} ${p.day} a las ${r.time}, ${r.people} personas, mesa ${r.tableN}. Te esperamos en ${r.address}. Si no podés venir, avisanos por acá.`;
}
