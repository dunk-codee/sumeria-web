import { z } from "zod";
import { isISODate } from "./dates";
import { COMBO_MAX_TABLES } from "./combos";
import { MAX_PEOPLE } from "./turns";

export const isoDate = z.string().refine(isISODate, "Fecha inválida");

export const availabilityQuery = z.object({
  date: isoDate,
  people: z.coerce.number().int().min(1).max(MAX_PEOPLE).default(2),
});

export const reservationInput = z.object({
  date: isoDate,
  people: z.number().int().min(1).max(MAX_PEOPLE),
  /** Una mesa, o varias si se combinan (ver `lib/combos.ts`). */
  tables: z.array(z.number().int().positive()).min(1, "Elegí una mesa").max(COMBO_MAX_TABLES, "Demasiadas mesas combinadas"),
  name: z.string().trim().min(2, "Completá tu nombre").max(80),
  phone: z
    .string()
    .trim()
    .max(30)
    .refine((v) => v.replace(/\D/g, "").length >= 7, "Completá un teléfono válido"),
  comment: z.string().trim().max(300).optional().default(""),
});
export type ReservationInput = z.infer<typeof reservationInput>;
