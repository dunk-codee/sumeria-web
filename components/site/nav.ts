/** Secciones del sitio (header, menú mobile y footer). Fuera del archivo del header porque el footer es de servidor. */
export const NAV = [
  { href: "/", label: "Inicio" },
  { href: "/carta", label: "Carta" },
  { href: "/novedades", label: "Novedades" },
  { href: "/reservas", label: "Reservas" },
  { href: "/nosotros", label: "Nosotros" },
] as const;
