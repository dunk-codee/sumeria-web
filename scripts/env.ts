import { config } from "dotenv";

// Los scripts corren fuera de Next: cargamos las mismas variables que la app.
config({ path: [".env.local", ".env"], quiet: true });
