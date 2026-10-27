import type { SiteSettings } from "./data";

/** Datos del local por defecto (se editan en el panel → Datos del local). */
export const DEFAULT_SETTINGS: Omit<SiteSettings, "booking"> = {
  whatsapp: "5493442535419",
  address: "25 de Mayo 181",
  city: "Concepción del Uruguay, Entre Ríos",
  instagram: "sumeriasushi",
  hours: [
    { key: "salon", label: "Salón", from: "19:30", to: "00:00" },
    { key: "pedidos", label: "Pedidos delivery y take away", from: "19:30", to: "23:30" },
    { key: "reservas", label: "Reservas", from: "20:00", to: "23:00" },
  ],
  zones: [],
};
