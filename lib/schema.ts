import { sql } from "drizzle-orm";
import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgTable,
  real,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

/** Fondos placeholder disponibles mientras no haya foto real. */
export const PLACEHOLDERS = ["madera", "pizarra", "negro", "makisu", "kraft"] as const;
export type Placeholder = (typeof PLACEHOLDERS)[number];

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  /** Define el orden de la barra de categorías en la carta. */
  position: integer("position").notNull().default(0),
  visible: boolean("visible").notNull().default(true),
  /** Aparece como acceso directo ("estrella") en el inicio. */
  featured: boolean("featured").notNull().default(false),
});

export const products = pgTable(
  "products",
  {
    id: serial("id").primaryKey(),
    categoryId: integer("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "restrict" }),
    name: text("name").notNull(),
    description: text("description").notNull().default(""),
    /** "8" → "8 piezas"; cualquier otro texto se muestra tal cual ("4 unidades"). */
    pieces: text("pieces"),
    price: integer("price").notNull(),
    glutenFree: boolean("gluten_free").notNull().default(false),
    available: boolean("available").notNull().default(true),
    position: integer("position").notNull().default(0),
    placeholder: text("placeholder").$type<Placeholder>().notNull().default("madera"),
    photoPublicId: text("photo_public_id"),
    photoUrl: text("photo_url"),
    /** Foto recortada (PNG/WebP sin fondo): se muestra entera sobre el fondo cálido. */
    photoCutout: boolean("photo_cutout").notNull().default(false),
  },
  (t) => [index("products_category_idx").on(t.categoryId)],
);

export const deliveryZones = pgTable("delivery_zones", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  price: integer("price").notNull(),
  position: integer("position").notNull().default(0),
});

export type HoursRow = { key: "salon" | "pedidos" | "reservas"; label: string; from: string; to: string };

export const settings = pgTable("settings", {
  id: integer("id").primaryKey().default(1),
  /** Solo dígitos, formato internacional: 5493442535419 */
  whatsapp: text("whatsapp").notNull(),
  address: text("address").notNull(),
  city: text("city").notNull(),
  instagram: text("instagram").notNull(),
  hours: jsonb("hours").$type<HoursRow[]>().notNull(),
});

export const EVENT_TYPES = ["evento", "promo", "sorteo", "novedad"] as const;
export type EventType = (typeof EVENT_TYPES)[number];

export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  type: text("type").$type<EventType>().notNull(),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  /** Texto del botón ("Participá en Instagram"). */
  ctaLabel: text("cta_label").notNull().default(""),
  /** "ig" | "carta" | "reserva" | "cat:<slug>" */
  ctaTarget: text("cta_target").notNull().default("carta"),
  /** Fecha grande de la tarjeta; si falta se usa vencimiento (o publicación en novedades). */
  eventDate: date("event_date", { mode: "string" }),
  /** Detalle de fecha: "Viernes 31 · cierra a las 21". */
  whenLabel: text("when_label"),
  publishedAt: date("published_at", { mode: "string" }).notNull(),
  expiresAt: date("expires_at", { mode: "string" }).notNull(),
  placeholder: text("placeholder").$type<Placeholder>().notNull().default("madera"),
  photoPublicId: text("photo_public_id"),
  photoUrl: text("photo_url"),
});

export const TABLE_SHAPES = ["round", "square", "long"] as const;
export type TableShape = (typeof TABLE_SHAPES)[number];

/** Mesas del salón. Coordenadas en %: x 0–100, y 0–70. */
export const tables = pgTable("tables", {
  n: integer("n").primaryKey(),
  capacity: integer("capacity").notNull(),
  shape: text("shape").$type<TableShape>().notNull(),
  x: real("x").notNull(),
  y: real("y").notNull(),
  w: real("w").notNull(),
  h: real("h").notNull(),
  location: text("location").notNull().default("Salón"),
});

export const FIXTURE_KINDS = ["hatch", "bar", "stool", "window", "door", "label"] as const;
export type FixtureKind = (typeof FIXTURE_KINDS)[number];

/** Elementos fijos del plano: cocina, barra, banquetas, baños, ventanal, entrada. */
export const fixtures = pgTable("fixtures", {
  id: serial("id").primaryKey(),
  kind: text("kind").$type<FixtureKind>().notNull(),
  x: real("x").notNull(),
  y: real("y").notNull(),
  w: real("w").notNull(),
  h: real("h").notNull(),
  label: text("label"),
});

export const RES_STATUSES = ["pend", "conf", "canc", "occ"] as const;
export type ResStatus = (typeof RES_STATUSES)[number];
export const RES_SOURCES = ["web", "tel", "wa", "walkin"] as const;
export type ResSource = (typeof RES_SOURCES)[number];

/**
 * Reservas. Las mesas "ocupadas sin reserva" (walk-ins) se guardan con
 * status `occ` y source `walkin`, así el mismo índice único bloquea la mesa.
 */
export const reservations = pgTable(
  "reservations",
  {
    id: serial("id").primaryKey(),
    date: date("date", { mode: "string" }).notNull(),
    turn: integer("turn").notNull(),
    time: text("time").notNull(),
    name: text("name").notNull(),
    phone: text("phone").notNull().default(""),
    people: integer("people").notNull(),
    tableN: integer("table_n").notNull(),
    status: text("status").$type<ResStatus>().notNull().default("pend"),
    source: text("source").$type<ResSource>().notNull().default("web"),
    note: text("note").notNull().default(""),
    arrivedAt: timestamp("arrived_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("reservations_slot_unique")
      .on(t.date, t.turn, t.tableN)
      .where(sql`${t.status} <> 'canc'`),
    index("reservations_date_idx").on(t.date, t.turn),
  ],
);

export type Category = typeof categories.$inferSelect;
export type Product = typeof products.$inferSelect;
export type DeliveryZone = typeof deliveryZones.$inferSelect;
export type Settings = typeof settings.$inferSelect;
export type EventRow = typeof events.$inferSelect;
export type TableRow = typeof tables.$inferSelect;
export type FixtureRow = typeof fixtures.$inferSelect;
export type Reservation = typeof reservations.$inferSelect;
