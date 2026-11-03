/** Datos de contacto del local: normalización del WhatsApp (celular argentino) y del usuario de Instagram. Funciones puras: las usan el panel y el servidor. */

/** Largo de un celular argentino en formato de WhatsApp: 549 + 10 dígitos (código de área + número). */
export const AR_WA_LENGTH = 13;

/**
 * Lleva lo que escribió la persona al formato de wa.me ("5493442535419"): agrega el 54 y el 9 si faltan,
 * saca el 0 inicial y el 15 de los celulares viejos ("3442 15 535419"). Se puede llamar mientras escribe.
 */
export function arPhoneDigits(raw: string): string {
  const d = raw.replace(/\D/g, "").replace(/^00/, "");
  if (!d) return "";
  let rest: string;
  if (d.startsWith("549")) rest = d.slice(3);
  else if (d === "5") return "5"; // todavía escribiendo el "54"
  else if (d.startsWith("54")) rest = d.slice(2).replace(/^9/, "");
  else rest = d.replace(/^0/, "");
  // "15" después del código de área (2 a 4 dígitos) cuando sobran dígitos: 10 + 2 = 12.
  if (rest.length === 12) {
    for (const area of [4, 3, 2]) {
      if (rest.slice(area, area + 2) === "15") {
        rest = rest.slice(0, area) + rest.slice(area + 2);
        break;
      }
    }
  }
  return ("549" + rest).slice(0, AR_WA_LENGTH);
}

export const isArPhone = (digits: string) => digits.length === AR_WA_LENGTH && digits.startsWith("549");

/** "5493442535419" → "+54 9 3442 53-5419" (sin separadores colgando mientras escribe). */
export function formatArPhone(digits: string): string {
  if (!digits) return "";
  if (!digits.startsWith("549")) return `+${digits}`;
  const r = digits.slice(3);
  let out = "+54 9";
  if (r.length) out += ` ${r.slice(0, 4)}`;
  if (r.length > 4) out += ` ${r.slice(4, 6)}`;
  if (r.length > 6) out += `-${r.slice(6, 10)}`;
  return out;
}

/** Solo la parte que escribe la persona, sin el "+54 9": "5493442535419" → "3442 53-5419". */
export function formatArLocal(digits: string): string {
  return formatArPhone(digits).replace(/^\+54 9 ?/, "");
}

/** Lo que escribió en el campo (solo código de área y número, o un número pegado completo) → dígitos con 549. Vacío si no hay nada. */
export function arPhoneFromLocal(typed: string): string {
  const d = typed.replace(/\D/g, "");
  if (!d) return "";
  return d.startsWith("54") || d.startsWith("0") ? arPhoneDigits(d) : arPhoneDigits("549" + d);
}

/** Acepta "@usuario", "usuario" o un link de Instagram pegado, y devuelve solo el usuario. */
export function instagramHandle(raw: string): string {
  return raw
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/^(www\.)?instagram\.com\//i, "")
    .replace(/[/?#].*$/, "")
    .replace(/^@/, "");
}

export const isInstagramHandle = (h: string) => /^[A-Za-z0-9._]{1,30}$/.test(h);

/** "930" → "09:30", "9" → "09:00". Devuelve null si no es una hora válida. */
export function normalizeTime(raw: string): string | null {
  const d = raw.replace(/\D/g, "");
  let h: string;
  let m: string;
  if (d.length <= 2) [h, m] = [d.padStart(2, "0"), "00"];
  else if (d.length === 3) [h, m] = [`0${d[0]}`, d.slice(1)];
  else [h, m] = [d.slice(0, 2), d.slice(2, 4)];
  if (!d || Number(h) > 23 || Number(m) > 59) return null;
  return `${h}:${m}`;
}

/** Mientras escribe: solo números, con los ":" puestos solos ("193" → "19:3"). */
export function maskTime(raw: string): string {
  const d = raw.replace(/\D/g, "").slice(0, 4);
  return d.length > 2 ? `${d.slice(0, 2)}:${d.slice(2)}` : d;
}
