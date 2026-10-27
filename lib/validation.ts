import { z } from "zod";
import { addDays, isISODate, todayISO } from "./dates";
import { BOOKING_DAYS, MAX_PEOPLE } from "./turns";

export const isoDate = z.string().refine(isISODate, "Fecha inválida");

/** La fecha tiene que estar dentro de la ventana reservable desde el sitio. */
export function inBookingWindow(date: string) {
  const today = todayISO();
  return date >= today && date <= addDays(today, BOOKING_DAYS - 1);
}

export const availabilityQuery = z.object({
  date: isoDate,
  turn: z.coerce.number().int().min(0).max(1),
  people: z.coerce.number().int().min(1).max(MAX_PEOPLE).default(2),
});

export const reservationInput = z.object({
  date: isoDate,
  turn: z.number().int().min(0).max(1),
  people: z.number().int().min(1).max(MAX_PEOPLE),
  tableN: z.number().int().positive(),
  name: z.string().trim().min(2, "Completá tu nombre").max(80),
  phone: z
    .string()
    .trim()
    .max(30)
    .refine((v) => v.replace(/\D/g, "").length >= 7, "Completá un teléfono válido"),
  comment: z.string().trim().max(300).optional().default(""),
});
export type ReservationInput = z.infer<typeof reservationInput>;
