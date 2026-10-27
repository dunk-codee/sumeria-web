import { FIXTURES, TABLES, ZONES } from "../scripts/data/plan";
import { MENU } from "../scripts/data/menu";
import type { MenuCategory, PlanData, SiteSettings } from "./data";
import { DEFAULT_BOOKING } from "./booking";
import { DEFAULT_SETTINGS } from "./defaults";
import { TABLE_BOX } from "./plan";

/**
 * Datos de respaldo para el "modo sin base" (producción sin DATABASE_URL).
 * Salen de los mismos archivos que el seed, con ids en el mismo orden en que el seed
 * los inserta: el carrito guardado sigue siendo válido cuando se conecte la base.
 */
let nextId = 0;
export const STATIC_MENU: MenuCategory[] = MENU.map((c, ci) => ({
  id: ci + 1,
  slug: c.slug,
  name: c.name,
  featured: !!c.featured,
  products: c.products.map((p) => ({
    id: ++nextId,
    name: p.name,
    description: p.description,
    pieces: p.pieces ?? null,
    price: p.price,
    glutenFree: false,
    available: true,
    placeholder: p.placeholder ?? "madera",
    photoPublicId: null,
    photoUrl: p.photo ? `/menu/${p.photo}.webp` : null,
    photoCutout: !!p.photo,
  })),
}));

export const STATIC_SETTINGS: SiteSettings = {
  ...DEFAULT_SETTINGS,
  booking: DEFAULT_BOOKING,
  zones: ZONES.map((z, i) => ({ id: i + 1, ...z })),
};

export const STATIC_PLAN: PlanData = {
  tables: TABLES.map((t) => ({ n: t.n, capacity: t.cap, shape: t.shape, x: t.x, y: t.y, location: t.location, ...TABLE_BOX })),
  fixtures: FIXTURES.map((f, i) => ({ id: i + 1, kind: f.kind, x: f.x, y: f.y, w: f.w, h: f.h, label: "label" in f ? f.label : null })),
};
