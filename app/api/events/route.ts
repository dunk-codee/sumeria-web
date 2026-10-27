import { getEvents } from "@/lib/data";

/** GET /api/events — publicaciones vigentes (entre publicación y vencimiento). */
export async function GET() {
  return Response.json({ events: await getEvents() });
}
