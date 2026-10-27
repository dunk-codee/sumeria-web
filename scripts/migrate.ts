import "./env";
import path from "node:path";

async function main() {
  const folder = path.join(process.cwd(), "drizzle");
  if (process.env.DATABASE_URL) {
    const { Pool, neonConfig } = await import("@neondatabase/serverless");
    const { drizzle } = await import("drizzle-orm/neon-serverless");
    const { migrate } = await import("drizzle-orm/neon-serverless/migrator");
    if (typeof WebSocket === "undefined") neonConfig.webSocketConstructor = (await import("ws")).default;
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    await migrate(drizzle({ client: pool }), { migrationsFolder: folder });
    await pool.end();
    console.log("✓ Migraciones aplicadas en Neon");
  } else {
    // PGlite migra solo al conectarse.
    const { getDb } = await import("../lib/db");
    await getDb();
    console.log("✓ Migraciones aplicadas en PGlite (.data/pglite)");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
