import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import * as schema from "./schema";

export type DB = PgDatabase<PgQueryResultHKT, typeof schema>;

/**
 * Conexión a la base.
 * - Con `DATABASE_URL` (Neon): driver serverless por WebSocket, que soporta transacciones.
 * - Sin `DATABASE_URL` (solo desarrollo): PGlite embebido en `.data/pglite`, con
 *   migraciones automáticas. Así el proyecto corre sin cuenta de Neon.
 */
const globalForDb = globalThis as unknown as { __sumeriaDb?: Promise<DB> };

async function connect(): Promise<DB> {
  const url = process.env.DATABASE_URL;
  if (url) {
    const { Pool, neonConfig } = await import("@neondatabase/serverless");
    const { drizzle } = await import("drizzle-orm/neon-serverless");
    if (typeof WebSocket === "undefined") {
      neonConfig.webSocketConstructor = (await import("ws")).default;
    }
    const pool = new Pool({ connectionString: url });
    return drizzle({ client: pool, schema }) as unknown as DB;
  }

  if (process.env.NODE_ENV === "production" && process.env.SUMERIA_ALLOW_PGLITE !== "1") {
    throw new Error("Falta DATABASE_URL (Neon) para producción.");
  }

  const { PGlite } = await import("@electric-sql/pglite");
  const { drizzle } = await import("drizzle-orm/pglite");
  const { migrate } = await import("drizzle-orm/pglite/migrator");
  const path = await import("node:path");
  const fs = await import("node:fs");
  const dir = path.join(process.cwd(), ".data", "pglite");
  fs.mkdirSync(path.dirname(dir), { recursive: true });
  const client = new PGlite(dir);
  const db = drizzle({ client, schema });
  await migrate(db, { migrationsFolder: path.join(process.cwd(), "drizzle") });
  return db as unknown as DB;
}

export function getDb(): Promise<DB> {
  if (!globalForDb.__sumeriaDb) {
    globalForDb.__sumeriaDb = connect().catch((err) => {
      globalForDb.__sumeriaDb = undefined;
      throw err;
    });
  }
  return globalForDb.__sumeriaDb;
}

/** Código de Postgres de violación de unicidad (también lo propaga PGlite). */
export function isUniqueViolation(err: unknown): boolean {
  let e: unknown = err;
  for (let i = 0; i < 4 && e; i++) {
    if (typeof e === "object" && e !== null && (e as { code?: string }).code === "23505") return true;
    e = (e as { cause?: unknown }).cause;
  }
  return false;
}
