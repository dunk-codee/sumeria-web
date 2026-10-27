/**
 * Carga inicial de la base.
 *   npm run db:seed            → carta real, plano, zonas y datos del local
 *   npm run db:seed -- --demo  → además, novedades y reservas de ejemplo
 *   --force                    → borra y recarga aunque ya haya datos
 * Si Cloudinary está configurado, sube las fotos de public/menu y guarda su public_id.
 */
import "./env";
import path from "node:path";
import { sql } from "drizzle-orm";
import { addDays, todayISO } from "../lib/dates";
import { getDb } from "../lib/db";
import { sizeFor } from "../lib/plan";
import {
  categories,
  deliveryZones,
  events,
  fixtures,
  products,
  reservations,
  settings,
  tables,
} from "../lib/schema";
import { cloudinaryEnabled, CLOUDINARY_FOLDER, getCloudinary } from "../lib/cloudinary";
import { DEFAULT_SETTINGS } from "../lib/defaults";
import { MENU } from "./data/menu";
import { FIXTURES, TABLES, ZONES } from "./data/plan";

const args = new Set(process.argv.slice(2));
const DEMO = args.has("--demo");
const FORCE = args.has("--force");

async function uploadPhotos(): Promise<Map<string, { publicId: string; url: string }>> {
  const out = new Map<string, { publicId: string; url: string }>();
  if (!cloudinaryEnabled()) {
    console.log("· Cloudinary no configurado: las fotos se sirven desde /public/menu");
    return out;
  }
  const c = getCloudinary();
  const slugs = new Set(MENU.flatMap((c) => c.products.map((p) => p.photo).filter(Boolean) as string[]));
  for (const slug of slugs) {
    const file = path.join(process.cwd(), "public", "menu", `${slug}.webp`);
    const r = await c.uploader.upload(file, {
      public_id: `${CLOUDINARY_FOLDER}/productos/${slug}`,
      overwrite: true,
      resource_type: "image",
    });
    out.set(slug, { publicId: r.public_id, url: r.secure_url });
    process.stdout.write(".");
  }
  console.log(`\n✓ ${out.size} fotos subidas a Cloudinary`);
  return out;
}

async function main() {
  const db = await getDb();
  const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(categories);
  if (count > 0 && !FORCE) {
    console.log("La base ya tiene carta cargada. Usá --force para borrar y recargar.");
    return;
  }

  const photos = await uploadPhotos();

  await db.transaction(async (tx) => {
    await tx.execute(
      sql`TRUNCATE ${reservations}, ${products}, ${categories}, ${events}, ${tables}, ${fixtures}, ${deliveryZones}, ${settings} RESTART IDENTITY CASCADE`,
    );

    for (const [ci, cat] of MENU.entries()) {
      const [row] = await tx
        .insert(categories)
        .values({ slug: cat.slug, name: cat.name, position: ci, visible: true, featured: !!cat.featured })
        .returning({ id: categories.id });
      await tx.insert(products).values(
        cat.products.map((p, pi) => {
          const up = p.photo ? photos.get(p.photo) : undefined;
          return {
            categoryId: row.id,
            name: p.name,
            description: p.description,
            pieces: p.pieces ?? null,
            price: p.price,
            position: pi,
            placeholder: p.placeholder ?? "madera",
            photoPublicId: up?.publicId ?? null,
            photoUrl: up?.url ?? (p.photo ? `/menu/${p.photo}.webp` : null),
            photoCutout: !!p.photo,
          };
        }),
      );
    }

    await tx.insert(tables).values(TABLES.map((t) => ({ n: t.n, capacity: t.cap, shape: t.shape, x: t.x, y: t.y, location: t.location, ...sizeFor(t.cap, t.shape) })));
    await tx.insert(fixtures).values(FIXTURES.map((f) => ({ ...f, label: "label" in f ? f.label : null })));
    await tx.insert(deliveryZones).values(ZONES.map((z, i) => ({ ...z, position: i })));
    const { zones: _z, ...s } = DEFAULT_SETTINGS;
    void _z;
    await tx.insert(settings).values({ id: 1, ...s });

    if (DEMO) {
      const t = todayISO();
      await tx.insert(events).values([
        { type: "sorteo", title: "Tabla de 30 piezas para dos", description: "Seguinos, dale me gusta al posteo y etiquetá a quien te acompañaría. Sorteamos por historias.", ctaLabel: "Participá en Instagram", ctaTarget: "ig", whenLabel: "Cierra el viernes a las 21", publishedAt: addDays(t, -2), expiresAt: addDays(t, 4), placeholder: "madera" },
        { type: "promo", title: "Martes de rolls: 2×1", description: "Llevá dos rolls clásicos y pagá uno. Válido en el salón y en take away.", ctaLabel: "Armá tu pedido", ctaTarget: "carta", whenLabel: "Todos los martes del mes", eventDate: addDays(t, 8), publishedAt: addDays(t, -1), expiresAt: addDays(t, 30), placeholder: "pizarra" },
        { type: "evento", title: "Noche de barra", description: "Armamos rolls frente a vos, con menú de pasos y maridaje. Cupos limitados.", ctaLabel: "Reservá tu lugar", ctaTarget: "reserva", whenLabel: "21:00 · cupos limitados", eventDate: addDays(t, 11), publishedAt: addDays(t, -4), expiresAt: addDays(t, 11), placeholder: "negro" },
        { type: "novedad", title: "Llegaron los bagels", description: "Bagel Philadelphia, New York, Teriyaki y más, para comer acá o llevar. Ya están en la carta.", ctaLabel: "Ver en la carta", ctaTarget: "cat:bagels", publishedAt: addDays(t, -6), expiresAt: addDays(t, 25), placeholder: "kraft" },
        { type: "promo", title: "Ensaladas de septiembre", description: "20% off en ensaladas para take away.", ctaLabel: "Armá tu pedido", ctaTarget: "cat:ensaladas", publishedAt: addDays(t, -56), expiresAt: addDays(t, -26), placeholder: "makisu" },
      ]);
      const R = (d: number, turn: number, time: string, name: string, phone: string, people: number, tableN: number, status: "pend" | "conf" | "canc" | "occ", source: "web" | "tel" | "wa" | "walkin", note = "") => ({ date: addDays(t, d), turn, time, name, phone, people, tableN, status, source, note });
      await tx.insert(reservations).values([
        R(0, 0, "20:00", "Martina López", "3442 15 412233", 4, 5, "conf", "web"),
        R(0, 0, "20:15", "Diego Ramírez", "3442 15 559012", 2, 1, "pend", "web", "Es nuestro aniversario"),
        R(0, 0, "20:30", "Familia Gómez", "3442 15 330987", 6, 4, "conf", "tel"),
        R(0, 1, "22:00", "Lucía Fernández", "3442 15 778120", 2, 3, "pend", "web"),
        R(0, 1, "22:00", "Juan Pablo Ruiz", "3442 15 601455", 8, 7, "pend", "wa", "Cumpleaños, traen torta"),
        R(0, 1, "22:15", "Sofía Acosta", "3442 15 219834", 2, 2, "conf", "web"),
        R(0, 1, "22:30", "Ana Ortiz", "3442 15 448210", 4, 6, "canc", "tel"),
        R(0, 1, "22:00", "Sin reserva", "", 2, 8, "occ", "walkin"),
        R(1, 1, "22:00", "Tomás Benítez", "3442 15 990321", 4, 5, "pend", "web"),
        R(4, 0, "20:00", "Carla Méndez", "3442 15 120044", 6, 4, "conf", "wa"),
      ]);
    }
  });

  const n = MENU.reduce((a, c) => a + c.products.length, 0);
  console.log(`✓ Carta: ${MENU.length} categorías, ${n} productos`);
  console.log(`✓ Plano: ${TABLES.length} mesas · Zonas: ${ZONES.length}`);
  if (DEMO) console.log("✓ Novedades y reservas de ejemplo");
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
