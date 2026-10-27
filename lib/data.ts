import { and, asc, eq, gte, lte } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { DEFAULT_BOOKING, type BookingConfig } from "./booking";
import { todayISO } from "./dates";
import { dbConfigured, getDb } from "./db";
import { DEFAULT_SETTINGS } from "./defaults";
import { STATIC_MENU, STATIC_PLAN, STATIC_SETTINGS } from "./static-data";
import {
  categories,
  deliveryZones,
  events,
  fixtures,
  products,
  settings,
  tables,
  type HoursRow,
} from "./schema";

/**
 * Lecturas públicas cacheadas. Cada una lleva un tag que el panel expira
 * (`updateTag`) al guardar, así el sitio refleja los cambios sin redeploy.
 * Sin base configurada (producción sin DATABASE_URL) devuelven los datos estáticos del seed.
 */
export const TAGS = { menu: "menu", events: "events", plan: "plan", settings: "settings" } as const;

export type MenuProduct = {
  id: number;
  name: string;
  description: string;
  pieces: string | null;
  price: number;
  glutenFree: boolean;
  available: boolean;
  placeholder: string;
  photoPublicId: string | null;
  photoUrl: string | null;
  photoCutout: boolean;
};
export type MenuCategory = { id: number; slug: string; name: string; featured: boolean; products: MenuProduct[] };

export async function getMenu(): Promise<MenuCategory[]> {
  "use cache";
  cacheLife("max");
  cacheTag(TAGS.menu);
  if (!dbConfigured()) return STATIC_MENU;
  const db = await getDb();
  const cats = await db.select().from(categories).where(eq(categories.visible, true)).orderBy(asc(categories.position), asc(categories.id));
  const prods = await db.select().from(products).orderBy(asc(products.position), asc(products.id));
  return cats.map((c) => ({
    id: c.id,
    slug: c.slug,
    name: c.name,
    featured: c.featured,
    products: prods
      .filter((p) => p.categoryId === c.id)
      .map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        pieces: p.pieces,
        price: p.price,
        glutenFree: p.glutenFree,
        available: p.available,
        placeholder: p.placeholder,
        photoPublicId: p.photoPublicId,
        photoUrl: p.photoUrl,
        photoCutout: p.photoCutout,
      })),
  }));
}

export type SiteSettings = {
  whatsapp: string;
  address: string;
  city: string;
  instagram: string;
  hours: HoursRow[];
  zones: { id: number; name: string; description: string; price: number }[];
  /** Días reservables desde el sitio (rango y días bloqueados). */
  booking: BookingConfig;
};


export async function getSettings(): Promise<SiteSettings> {
  "use cache";
  cacheLife("max");
  cacheTag(TAGS.settings);
  if (!dbConfigured()) return STATIC_SETTINGS;
  const db = await getDb();
  const [row] = await db.select().from(settings).where(eq(settings.id, 1));
  const zones = await db.select().from(deliveryZones).orderBy(asc(deliveryZones.position), asc(deliveryZones.id));
  const base = row ?? DEFAULT_SETTINGS;
  return {
    whatsapp: base.whatsapp,
    address: base.address,
    city: base.city,
    instagram: base.instagram,
    hours: base.hours,
    zones: zones.map((z) => ({ id: z.id, name: z.name, description: z.description, price: z.price })),
    booking: row ? { from: row.bookingFrom, to: row.bookingTo, blocked: row.blockedDates } : DEFAULT_BOOKING,
  };
}

export type PublicEvent = {
  id: number;
  type: "evento" | "promo" | "sorteo" | "novedad";
  title: string;
  description: string;
  ctaLabel: string;
  ctaTarget: string;
  eventDate: string | null;
  whenLabel: string | null;
  publishedAt: string;
  expiresAt: string;
  placeholder: string;
  photoPublicId: string | null;
  photoUrl: string | null;
};

/** Eventos visibles hoy (entre publicación y vencimiento). Se recalcula cada hora. */
export async function getEvents(): Promise<PublicEvent[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(TAGS.events);
  if (!dbConfigured()) return [];
  const today = todayISO();
  const db = await getDb();
  const rows = await db
    .select()
    .from(events)
    .where(and(lte(events.publishedAt, today), gte(events.expiresAt, today)))
    .orderBy(asc(events.expiresAt));
  return rows.map((e) => ({ ...e }));
}

export type PlanData = {
  tables: { n: number; capacity: number; shape: "round" | "square" | "long"; x: number; y: number; w: number; h: number; location: string }[];
  fixtures: { id: number; kind: "hatch" | "bar" | "stool" | "window" | "door" | "label"; x: number; y: number; w: number; h: number; label: string | null }[];
};

export async function getPlan(): Promise<PlanData> {
  "use cache";
  cacheLife("max");
  cacheTag(TAGS.plan);
  if (!dbConfigured()) return STATIC_PLAN;
  const db = await getDb();
  const t = await db.select().from(tables).orderBy(asc(tables.n));
  const f = await db.select().from(fixtures).orderBy(asc(fixtures.id));
  return { tables: t, fixtures: f };
}
