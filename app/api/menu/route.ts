import { getMenu } from "@/lib/data";

/** GET /api/menu — carta visible, ordenada por categoría. */
export async function GET() {
  return Response.json({ categories: await getMenu() });
}
