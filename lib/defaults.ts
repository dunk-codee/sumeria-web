import type { SiteSettings } from "./data";
import { DEFAULT_WEEK } from "./hours";

/** Datos del local por defecto (se editan en el panel → Datos del local). */
export const DEFAULT_SETTINGS: Omit<SiteSettings, "booking"> = {
  whatsapp: "5493442535419",
  address: "25 de Mayo 181",
  city: "Concepción del Uruguay, Entre Ríos",
  instagram: "sumeriasushi",
  hours: DEFAULT_WEEK,
  zones: [],
};
