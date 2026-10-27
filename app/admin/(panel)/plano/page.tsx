import type { Metadata } from "next";
import { PlanEditor } from "@/components/admin/PlanEditor";
import { planTables, tablesWithUpcoming } from "@/lib/admin-data";
import { requireAdmin } from "@/lib/auth";

export const metadata: Metadata = { title: "Plano del local" };

export default async function PlanoAdmin() {
  await requireAdmin();
  const [plan, upcoming] = await Promise.all([planTables(), tablesWithUpcoming()]);
  return <PlanEditor key={plan.tables.map((t) => `${t.n}:${t.x}:${t.y}:${t.capacity}:${t.shape}`).join("|")} initial={plan} withUpcoming={upcoming} />;
}
